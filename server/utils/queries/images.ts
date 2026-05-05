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
  // Get the instance
  const [instance] = await db
    .select()
    .from(schema.imageInstances)
    .where(eq(schema.imageInstances.id, instanceId));

  if (!instance) {
    return null;
  }

  // Get the base image
  const [base] = await db
    .select()
    .from(schema.baseImages)
    .where(eq(schema.baseImages.id, instance.imageId));

  if (!base) {
    return null;
  }

  // Get metadata (if exists)
  const [metadata] = await db
    .select()
    .from(schema.imageMetadata)
    .where(eq(schema.imageMetadata.imageInstanceId, instanceId))
    .limit(1);

  // Get layout (if exists)
  const [layout] = await db
    .select()
    .from(schema.imageLayouts)
    .where(eq(schema.imageLayouts.imageInstanceId, instanceId))
    .limit(1);

  return {
    base,
    instance,
    metadata: metadata || null,
    layout: layout || null,
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

  // Get instances
  const instances = await db
    .select()
    .from(schema.imageInstances)
    .where(and(...conditions))
    .orderBy(
      asc(schema.imageInstances.order),
      desc(schema.imageInstances.createdAt)
    );

  // Get all related data
  return await Promise.all(
    instances.map(async (instance) => {
      const [base] = await db
        .select()
        .from(schema.baseImages)
        .where(eq(schema.baseImages.id, instance.imageId));

      const [metadata] = await db
        .select()
        .from(schema.imageMetadata)
        .where(eq(schema.imageMetadata.imageInstanceId, instance.id))
        .limit(1);

      let layout = null;
      let layoutGroup = null;
      if (options.includeLayouts) {
        [layout] = await db
          .select()
          .from(schema.imageLayouts)
          .where(eq(schema.imageLayouts.imageInstanceId, instance.id))
          .limit(1);

        // If the layout exists and has a group, fetch the group
        if (layout && layout.layoutGroupId) {
          [layoutGroup] = await db
            .select()
            .from(schema.layoutGroups)
            .where(eq(schema.layoutGroups.id, layout.layoutGroupId))
            .limit(1);
        }
      }

      return {
        base,
        instance,
        metadata: metadata || null,
        layout: layout || null,
        layoutGroup: layoutGroup || null,
      };
    })
  );
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
  const [instance] = await db
    .select()
    .from(schema.imageInstances)
    .where(
      and(
        eq(schema.imageInstances.context, context as any),
        eq(schema.imageInstances.isPrimary, true)
      )
    )
    .limit(1);

  if (!instance) {
    return null;
  }

  const [base] = await db
    .select()
    .from(schema.baseImages)
    .where(eq(schema.baseImages.id, instance.imageId));

  return base ? { base, instance } : null;
}
