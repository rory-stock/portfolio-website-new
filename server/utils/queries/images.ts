import type { DrizzleD1Database } from "drizzle-orm/d1";
import { and, asc, desc, eq } from "drizzle-orm";
import * as schema from "~~/server/db/schema";

/**
 * Get complete image data with instance, metadata, and layout
 */
export async function getImageWithInstance(
  db: DrizzleD1Database<typeof schema>,
  instanceId: number
) {
  const rows = await db
    .select({
      base: schema.baseImages,
      instance: schema.imageInstances,
      metadata: schema.imageMetadata,
      layout: schema.imageLayouts,
    })
    .from(schema.imageInstances)
    .innerJoin(
      schema.baseImages,
      eq(schema.imageInstances.imageId, schema.baseImages.id)
    )
    .leftJoin(
      schema.imageMetadata,
      eq(schema.imageMetadata.imageInstanceId, schema.imageInstances.id)
    )
    .leftJoin(
      schema.imageLayouts,
      eq(schema.imageLayouts.imageInstanceId, schema.imageInstances.id)
    )
    .where(eq(schema.imageInstances.id, instanceId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    base: row.base,
    instance: row.instance,
    metadata: row.metadata || null,
    layout: row.layout || null,
  };
}

/**
 * Get all images for a context
 */
export async function getImagesForContext(
  db: DrizzleD1Database<typeof schema>,
  context: string,
  options: {
    isPublic?: boolean;
    includeLayouts?: boolean;
  } = {}
) {
  // Build where conditions
  const conditions = [eq(schema.imageInstances.context, context as any)];

  if (options.isPublic !== undefined) {
    conditions.push(eq(schema.imageInstances.isPublic, options.isPublic));
  }

  if (options.includeLayouts) {
    // Join instances → base_images → metadata → image_layouts → layout_groups
    const rows = await db
      .select({
        base: schema.baseImages,
        instance: schema.imageInstances,
        metadata: schema.imageMetadata,
        layout: schema.imageLayouts,
        layoutGroup: schema.layoutGroups,
      })
      .from(schema.imageInstances)
      .innerJoin(
        schema.baseImages,
        eq(schema.imageInstances.imageId, schema.baseImages.id)
      )
      .leftJoin(
        schema.imageMetadata,
        eq(schema.imageMetadata.imageInstanceId, schema.imageInstances.id)
      )
      .leftJoin(
        schema.imageLayouts,
        eq(schema.imageLayouts.imageInstanceId, schema.imageInstances.id)
      )
      .leftJoin(
        schema.layoutGroups,
        eq(schema.imageLayouts.layoutGroupId, schema.layoutGroups.id)
      )
      .where(and(...conditions))
      .orderBy(
        asc(schema.imageInstances.order),
        desc(schema.imageInstances.createdAt)
      );

    return rows.map((row) => ({
      base: row.base,
      instance: row.instance,
      metadata: row.metadata || null,
      layout: row.layout || null,
      layoutGroup: row.layoutGroup || null,
    }));
  }

  // Without layouts — simpler join
  const rows = await db
    .select({
      base: schema.baseImages,
      instance: schema.imageInstances,
      metadata: schema.imageMetadata,
    })
    .from(schema.imageInstances)
    .innerJoin(
      schema.baseImages,
      eq(schema.imageInstances.imageId, schema.baseImages.id)
    )
    .leftJoin(
      schema.imageMetadata,
      eq(schema.imageMetadata.imageInstanceId, schema.imageInstances.id)
    )
    .where(and(...conditions))
    .orderBy(
      asc(schema.imageInstances.order),
      desc(schema.imageInstances.createdAt)
    );

  return rows.map((row) => ({
    base: row.base,
    instance: row.instance,
    metadata: row.metadata || null,
    layout: null,
    layoutGroup: null,
  }));
}

/**
 * Get all instances of an image by r2_path
 */
export async function getImagesByR2Path(
  db: DrizzleD1Database<typeof schema>,
  r2Path: string
) {
  // Get base image
  const [base] = await db
    .select()
    .from(schema.baseImages)
    .where(eq(schema.baseImages.r2Path, r2Path));

  if (!base) {
    return null;
  }

  // Get all instances
  const instances = await db
    .select()
    .from(schema.imageInstances)
    .where(eq(schema.imageInstances.imageId, base.id));

  return {
    base,
    instances,
  };
}

/**
 * Get the primary image for a context
 */
export async function getPrimaryImageForContext(
  db: DrizzleD1Database<typeof schema>,
  context: string
) {
  const rows = await db
    .select({
      base: schema.baseImages,
      instance: schema.imageInstances,
    })
    .from(schema.imageInstances)
    .innerJoin(
      schema.baseImages,
      eq(schema.imageInstances.imageId, schema.baseImages.id)
    )
    .where(
      and(
        eq(schema.imageInstances.context, context as any),
        eq(schema.imageInstances.isPrimary, true)
      )
    )
    .limit(1);

  const row = rows[0];
  return row ? { base: row.base, instance: row.instance } : null;
}
