import { eq, inArray, and, asc } from "drizzle-orm";
import * as schema from "~~/server/db/schema";
import { useDB } from "~~/server/db/client";
import { isValidLayoutType, LAYOUT_TYPES } from "~/utils/layouts";
import { requireAuth } from "~~/server/utils/requireAuth";
import { logger } from "~/utils/logger";
import type { LayoutAssignRequest, LayoutAssignResponse } from "~~/types/api";

export default defineEventHandler(
  async (event): Promise<LayoutAssignResponse> => {
    await requireAuth(event);

    const db = useDB(event);
    const body = await readBody<LayoutAssignRequest>(event);

    const { image_ids, layout_type, context } = body as {
      image_ids: number[];
      layout_type: string;
      context: string;
    };

    // Validation
    if (!image_ids || !Array.isArray(image_ids) || !layout_type || !context) {
      throw createError({
        statusCode: 400,
        message: "image_ids, layout_type, and context required",
      });
    }

    if (!isValidLayoutType(layout_type)) {
      throw createError({
        statusCode: 400,
        message: `Invalid layout_type: ${layout_type}`,
      });
    }

    const layoutConfig = LAYOUT_TYPES[layout_type];
    if (!layoutConfig) {
      throw createError({
        statusCode: 400,
        message: `Invalid layout_type: ${layout_type}`,
      });
    }

    if (image_ids.length !== layoutConfig.imageCount) {
      throw createError({
        statusCode: 400,
        message: `Layout ${layout_type} requires exactly ${layoutConfig.imageCount} images, got ${image_ids.length}`,
      });
    }

    // Fetch instances to validate they exist and belong to context
    const selectedInstances = await db
      .select()
      .from(schema.imageInstances)
      .where(
        and(
          inArray(schema.imageInstances.id, image_ids),
          eq(schema.imageInstances.context, context as any)
        )
      );

    if (selectedInstances.length !== image_ids.length) {
      throw createError({
        statusCode: 404,
        message: "One or more images not found in this context",
      });
    }

    // Check if any selected images are already in a layout
    // If so, remove those old layouts first
    const instancesWithLayouts = await db
      .select()
      .from(schema.imageLayouts)
      .where(inArray(schema.imageLayouts.imageInstanceId, image_ids));

    if (instancesWithLayouts.length > 0) {
      const oldGroupIds = instancesWithLayouts
        .map((il) => il.layoutGroupId)
        .filter((id): id is number => id !== null);

      const uniqueGroupIds = [...new Set(oldGroupIds)];

      // Delete old layout groups and their image_layouts
      for (const groupId of uniqueGroupIds) {
        await db
          .delete(schema.imageLayouts)
          .where(eq(schema.imageLayouts.layoutGroupId, groupId));

        await db
          .delete(schema.layoutGroups)
          .where(eq(schema.layoutGroups.id, groupId));

        logger.info("Removed old layout group", { groupId, context });
      }
    }

    // Sort instances by their current display order
    const sortedInstances = selectedInstances.sort((a, b) => {
      const orderA = a.order ?? Infinity;
      const orderB = b.order ?? Infinity;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Validate images are consecutive (strict)
    for (let i = 1; i < sortedInstances.length; i++) {
      const prevOrder = sortedInstances[i - 1].order;
      const currOrder = sortedInstances[i].order;

      // Both must have order set
      if (prevOrder === null || currOrder === null) {
        throw createError({
          statusCode: 400,
          message: "All selected images must have display order set",
        });
      }

      // Check if consecutive (no gaps)
      if (currOrder - prevOrder !== 1) {
        throw createError({
          statusCode: 400,
          message:
            "Selected images must be consecutive in display order (no gaps allowed)",
        });
      }
    }

    // Create a layout group for ALL layouts (single or multi-image)
    const groupDisplayOrder = sortedInstances[0].order ?? 0;

    const [layoutGroup] = await db
      .insert(schema.layoutGroups)
      .values({
        context,
        layoutType: layout_type as any,
        groupDisplayOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const layoutGroupId = layoutGroup.id;
    const isGroupLayout = layoutConfig.imageCount > 1;

    // Create image_layouts for each instance
    for (let i = 0; i < image_ids.length; i++) {
      const instanceId = image_ids[i];

      await db.insert(schema.imageLayouts).values({
        imageInstanceId: instanceId,
        layoutGroupId: layoutGroupId,
        positionInGroup: isGroupLayout ? i : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Get updated images
    const updatedImagesData = await db
      .select()
      .from(schema.imageInstances)
      .where(inArray(schema.imageInstances.id, image_ids))
      .orderBy(asc(schema.imageInstances.order));

    // Transform to display format
    const displayImages = await Promise.all(
      updatedImagesData.map(async (instance) => {
        const [base] = await db
          .select()
          .from(schema.baseImages)
          .where(eq(schema.baseImages.id, instance.imageId));

        const [metadata] = await db
          .select()
          .from(schema.imageMetadata)
          .where(eq(schema.imageMetadata.imageInstanceId, instance.id))
          .limit(1);

        const [layout] = await db
          .select()
          .from(schema.imageLayouts)
          .where(eq(schema.imageLayouts.imageInstanceId, instance.id))
          .limit(1);

        let layoutGroup = null;
        if (layout && layout.layoutGroupId) {
          [layoutGroup] = await db
            .select()
            .from(schema.layoutGroups)
            .where(eq(schema.layoutGroups.id, layout.layoutGroupId));
        }

        const { imageWithInstanceToDisplay } =
          await import("~~/server/utils/imageTransform");

        return imageWithInstanceToDisplay(
          {
            base,
            instance,
            metadata: metadata || null,
            layout: layout || null,
          },
          layoutGroup
            ? {
                layoutType: layoutGroup.layoutType,
                groupDisplayOrder: layoutGroup.groupDisplayOrder,
              }
            : null
        );
      })
    );

    return {
      success: true,
      images: displayImages,
      group_id: layoutGroupId,
    };
  }
);
