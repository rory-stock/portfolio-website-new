import type { DrizzleD1Database } from "drizzle-orm/d1";
import { asc, eq } from "drizzle-orm";
import * as schema from "~~/server/db/schema";
import { getImageWithInstance } from "./images";

/**
 * Get all layouts for a context with their images
 */
export async function getLayoutsForContext(
  db: DrizzleD1Database<typeof schema>,
  context: string
) {
  // Get all layout groups for this context
  const layoutGroups = await db
    .select()
    .from(schema.layoutGroups)
    .where(eq(schema.layoutGroups.context, context))
    .orderBy(asc(schema.layoutGroups.groupDisplayOrder));

  // For each group, get the images
  return await Promise.all(
    layoutGroups.map(async (group) => {
      const imageLayouts = await db
        .select()
        .from(schema.imageLayouts)
        .where(eq(schema.imageLayouts.layoutGroupId, group.id))
        .orderBy(asc(schema.imageLayouts.positionInGroup));

      const images = await Promise.all(
        imageLayouts.map((il) => getImageWithInstance(db, il.imageInstanceId))
      );

      return {
        group,
        images: images.filter((img) => img !== null),
      };
    })
  );
}

/**
 * Get layout info for a specific image instance
 */
export async function getImageLayout(
  db: DrizzleD1Database<typeof schema>,
  imageInstanceId: number
) {
  const [imageLayout] = await db
    .select()
    .from(schema.imageLayouts)
    .where(eq(schema.imageLayouts.imageInstanceId, imageInstanceId))
    .limit(1);

  if (!imageLayout || !imageLayout.layoutGroupId) {
    return null;
  }

  const [layoutGroup] = await db
    .select()
    .from(schema.layoutGroups)
    .where(eq(schema.layoutGroups.id, imageLayout.layoutGroupId));

  return layoutGroup ? { imageLayout, layoutGroup } : null;
}
