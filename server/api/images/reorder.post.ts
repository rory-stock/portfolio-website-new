import { eq, and } from "drizzle-orm";
import * as schema from "~~/server/db/schema";
import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import type { ImageReorderRequest, ImageReorderResponse } from "~~/types/api";
import { getImagesForContext } from "~~/server/utils/queries";
import { imageWithInstanceArrayToDisplay } from "~~/server/utils/imageTransform";

export default defineEventHandler(
  async (event): Promise<ImageReorderResponse> => {
    await requireAuth(event);

    const db = useDB(event);
    const body = await readBody<ImageReorderRequest>(event);

    const { context, order } = body as {
      context: string;
      order: number[]; // Array of instance IDs in the desired order
    };

    if (!context || !order || !Array.isArray(order)) {
      throw createError({
        statusCode: 400,
        message: "context and order array required",
      });
    }

    // Get all instances for this context to identify groups
    const imagesData = await getImagesForContext(db, context);

    // Build a map of instanceId -> layoutGroupId
    const instanceLayoutMap = new Map<number, number | null>();
    imagesData.forEach((imgData) => {
      const layoutGroupId = imgData.layout?.layoutGroupId || null;
      instanceLayoutMap.set(imgData.instance.id, layoutGroupId);
    });

    // Track which layout group IDs we've seen and their first position
    const groupPositions = new Map<number, number>();

    // Update order and group_display_order for each instance
    for (let i = 0; i < order.length; i++) {
      const instanceId = order[i];
      const layoutGroupId = instanceLayoutMap.get(instanceId);

      // Determine group_display_order for layouts
      if (layoutGroupId !== null && layoutGroupId !== undefined) {
        // If this is a grouped image, track the group's first position
        if (!groupPositions.has(layoutGroupId)) {
          groupPositions.set(layoutGroupId, i);
        }

        const groupDisplayOrder = groupPositions.get(layoutGroupId)!;

        // Update layout group's display order
        await db
          .update(schema.layoutGroups)
          .set({ groupDisplayOrder })
          .where(eq(schema.layoutGroups.id, layoutGroupId));
      }

      // Update instance order
      await db
        .update(schema.imageInstances)
        .set({
          order: i,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.imageInstances.id, instanceId),
            eq(schema.imageInstances.context, context as any)
          )
        );
    }

    // Get updated images
    const updatedImagesData = await getImagesForContext(db, context, {
      includeLayouts: true,
    });

    const displayImages = imageWithInstanceArrayToDisplay(updatedImagesData);

    return {
      success: true,
      images: displayImages,
    };
  }
);
