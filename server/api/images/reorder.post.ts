import { eq, and, asc } from "drizzle-orm";

import { images } from "~~/server/db/schema";
import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import { logger } from "~/utils/logger";
import type { ImageReorderRequest, ImageReorderResponse } from "~~/types/api";

export default defineEventHandler(async (event): Promise<ImageReorderResponse> => {
  await requireAuth(event);

  const db = useDB(event);
  const body = await readBody<ImageReorderRequest>(event);

  const { context, order } = body as {
    context: string;
    order: number[]; // Array of image IDs in the desired order
  };

  if (!context || !order || !Array.isArray(order)) {
    throw createError({
      statusCode: 400,
      message: "context and order array required",
    });
  }

  // First, fetch all images to identify groups
  const allImages = await db
    .select()
    .from(images)
    .where(eq(images.context, context));

  // Build a map of imageId -> groupId
  const imageGroupMap = new Map<number, number | null>();
  allImages.forEach((img) => {
    imageGroupMap.set(img.id, img.layout_group_id);
  });

  // Track which group IDs we've seen and their first position
  const groupPositions = new Map<number, number>();

  // Update order and group_display_order for each image
  for (let i = 0; i < order.length; i++) {
    const imageId = order[i];
    const groupId = imageGroupMap.get(imageId);

    // Determine group_display_order
    let groupDisplayOrder = i;
    if (groupId !== null && groupId !== undefined) {
      // If this is a grouped image, use the group's first position
      if (!groupPositions.has(groupId)) {
        groupPositions.set(groupId, i);
      }
      groupDisplayOrder = groupPositions.get(groupId)!;
    }

    await db
      .update(images)
      .set({
        order: i,
        group_display_order: groupDisplayOrder,
      })
      .where(and(eq(images.id, imageId), eq(images.context, context)));
  }

  // Get updated images
  const updatedImages = await db
    .select()
    .from(images)
    .where(eq(images.context, context))
    .orderBy(asc(images.order));

  logger.info("Images reordered", { context, count: order.length });

  return {
    success: true,
    images: updatedImages,
  };
});
