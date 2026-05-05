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
    const [instance] = await db
      .select()
      .from(schema.imageInstances)
      .where(eq(schema.imageInstances.id, folder.coverImageId));

    if (instance) {
      const [base] = await db
        .select()
        .from(schema.baseImages)
        .where(eq(schema.baseImages.id, instance.imageId));

      if (base) {
        coverImage = { base, instance };
      }
    }
  }

  return { folder, coverImage };
}

/**
 * Get paginated images for a folder
 * Sorted by: captured_at → created_at → filename (deterministic)
 */
export async function getFolderImages(
  db: DrizzleD1Database<typeof schema>,
  folderId: number,
  options: { page?: number; limit?: number } = {}
) {
  const { page = 1, limit = 50 } = options;
  const offset = (page - 1) * limit;

  // Get folder_images links for this folder
  const folderImageLinks = await db
    .select()
    .from(schema.folderImages)
    .where(eq(schema.folderImages.folderId, folderId));

  if (folderImageLinks.length === 0) {
    return { images: [], total: 0, page, limit };
  }

  const instanceIds = folderImageLinks.map((fi) => fi.imageInstanceId);

  // Fetch all instances with their base images
  const results = await Promise.all(
    instanceIds.map(async (instanceId) => {
      const [instance] = await db
        .select()
        .from(schema.imageInstances)
        .where(eq(schema.imageInstances.id, instanceId));

      if (!instance) return null;

      const [base] = await db
        .select()
        .from(schema.baseImages)
        .where(eq(schema.baseImages.id, instance.imageId));

      if (!base) return null;

      const [metadata] = await db
        .select()
        .from(schema.imageMetadata)
        .where(eq(schema.imageMetadata.imageInstanceId, instanceId))
        .limit(1);

      return { base, instance, metadata: metadata || null, layout: null };
    })
  );

  // Filter nulls and sort: captured_at → created_at → filename
  const allImages = results
    .filter((r): r is NonNullable<typeof r> => r !== null)
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

  const total = allImages.length;
  const paginatedImages = allImages.slice(offset, offset + limit);

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
  const { images } = await getFolderImages(db, folderId, { page: 1, limit: 1 });

  const first = images[0];
  if (!first) return null;

  return first.instance.id;
}
