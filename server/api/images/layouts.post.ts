import { eq, inArray, and, asc } from "drizzle-orm";
import { images } from "~~/server/db/schema";
import { useDB } from "~~/server/db/client";
import { getNextLayoutGroupId } from "~/utils/layoutGroups";
import { isValidLayoutType, LAYOUT_TYPES } from "~/utils/layouts";
import { requireAuth } from "~~/server/utils/requireAuth";
import { logger } from "~/utils/logger";
import type { LayoutAssignRequest, LayoutAssignResponse } from "~~/types/api";

export default defineEventHandler(async (event): Promise<LayoutAssignResponse> => {
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

  // Fetch images to validate they exist and belong to context
  const selectedImages = await db
    .select()
    .from(images)
    .where(and(inArray(images.id, image_ids), eq(images.context, context)));

  if (selectedImages.length !== image_ids.length) {
    throw createError({
      statusCode: 404,
      message: "One or more images not found in this context",
    });
  }

  // Check if any selected images are already in a layout group
  // If so, remove the layout from all members of those old groups
  const oldGroupIds = selectedImages
    .map((img) => img.layout_group_id)
    .filter((id) => id !== null);

  if (oldGroupIds.length > 0) {
    // Get unique group IDs
    const uniqueGroupIds = [...new Set(oldGroupIds)];

    // Remove layout from all members of these groups
    for (const groupId of uniqueGroupIds) {
      await db
        .update(images)
        .set({
          layout_type: null,
          layout_group_id: null,
          group_display_order: null,
        })
        .where(eq(images.layout_group_id, groupId));
      logger.info("Removed layout from group", { groupId, context });
    }
  }

  // Sort images by their current display order
  const sortedImages = selectedImages.sort((a, b) => {
    const orderA = a.order ?? Infinity;
    const orderB = b.order ?? Infinity;
    if (orderA !== orderB) return orderA - orderB;
    return (
      new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime()
    );
  });

  // Validate images are consecutive (strict)
  for (let i = 1; i < sortedImages.length; i++) {
    const prevOrder = sortedImages[i - 1].order;
    const currOrder = sortedImages[i].order;

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

  // Generate group ID for multi-image layouts
  const isGroupLayout = layoutConfig.imageCount > 1;
  const groupId = isGroupLayout ? await getNextLayoutGroupId(db) : null;

  // Use the first image's order as group_display_order
  const groupDisplayOrder = isGroupLayout ? sortedImages[0].order : null;

  // Update all images with a layout assignment
  for (const imageId of image_ids) {
    await db
      .update(images)
      .set({
        layout_type,
        layout_group_id: groupId,
        group_display_order: groupDisplayOrder,
      })
      .where(eq(images.id, imageId));
  }

  // Return updated images
  const updatedImages = await db
    .select()
    .from(images)
    .where(inArray(images.id, image_ids))
    .orderBy(asc(images.order));

  return {
    success: true,
    images: updatedImages,
    group_id: groupId,
  };
});
