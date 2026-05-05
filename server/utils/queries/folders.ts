import type { DrizzleD1Database } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "~~/server/db/schema";

/**
 * Get a folder by ID
 */
export async function getFolderById(
  db: DrizzleD1Database<typeof schema>,
  folderId: number
) {
  const [folder] = await db
    .select()
    .from(schema.imageFolders)
    .where(eq(schema.imageFolders.id, folderId));

  return folder || null;
}

/**
 * Get a folder by ID with its cover image data resolved
 */
export async function getFolderWithCover(
  db: DrizzleD1Database<typeof schema>,
  folderId: number
) {
  const folder = await getFolderById(db, folderId);

  if (!folder) return null;

  let coverImage = null;

  if (folder.coverImageId) {
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
      .where(eq(schema.imageInstances.id, folder.coverImageId))
      .limit(1);

    const row = rows[0];
    if (row) {
      coverImage = { base: row.base, instance: row.instance };
    }
  }

  return { folder, coverImage };
}

/**
 * Get paginated images for a folder using a joined query.
 * Sorted by: captured_at → created_at → filename
 */
export async function getFolderImages(
  db: DrizzleD1Database<typeof schema>,
  folderId: number,
  options: { page?: number; limit?: number } = {}
) {
  const { page = 1, limit = 50 } = options;
  const offset = (page - 1) * limit;

  // query: folder_images → image_instances → base_images + metadata
  const rows = await db
    .select({
      base: schema.baseImages,
      instance: schema.imageInstances,
      metadata: schema.imageMetadata,
    })
    .from(schema.folderImages)
    .innerJoin(
      schema.imageInstances,
      eq(schema.folderImages.imageInstanceId, schema.imageInstances.id)
    )
    .innerJoin(
      schema.baseImages,
      eq(schema.imageInstances.imageId, schema.baseImages.id)
    )
    .leftJoin(
      schema.imageMetadata,
      eq(schema.imageMetadata.imageInstanceId, schema.imageInstances.id)
    )
    .where(eq(schema.folderImages.folderId, folderId));

  const sorted = rows
    .map((row) => ({
      base: row.base,
      instance: row.instance,
      metadata: row.metadata || null,
      layout: null,
    }))
    .sort((a, b) => {
      // 1. captured_at (nulls last)
      const aCaptured = a.base.capturedAt?.getTime() ?? Infinity;
      const bCaptured = b.base.capturedAt?.getTime() ?? Infinity;
      if (aCaptured !== bCaptured) return aCaptured - bCaptured;

      // 2. created_at
      const aCreated = a.instance.createdAt.getTime();
      const bCreated = b.instance.createdAt.getTime();
      if (aCreated !== bCreated) return aCreated - bCreated;

      // 3. filename
      return a.base.originalFilename.localeCompare(b.base.originalFilename);
    });

  const total = sorted.length;
  const paginatedImages = sorted.slice(offset, offset + limit);

  return { images: paginatedImages, total, page, limit };
}

/**
 * Check if a folder has subfolders
 */
export async function folderHasChildren(
  db: DrizzleD1Database<typeof schema>,
  folderId: number
): Promise<boolean> {
  const children = await db
    .select({ id: schema.imageFolders.id })
    .from(schema.imageFolders)
    .where(eq(schema.imageFolders.parentFolderId, folderId))
    .limit(1);

  return children.length > 0;
}

/**
 * Get the first image in a folder (for auto-selecting cover)
 * Uses the same sort order as getFolderImages
 */
export async function getFirstFolderImage(
  db: DrizzleD1Database<typeof schema>,
  folderId: number
): Promise<number | null> {
  const { images } = await getFolderImages(db, folderId, {
    page: 1,
    limit: 1,
  });

  const first = images[0];
  if (!first) return null;

  return first.instance.id;
}
