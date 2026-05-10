import type { DrizzleD1Database } from "drizzle-orm/d1";
import { desc, eq } from "drizzle-orm";
import * as schema from "~~/server/db/schema";
import { getFolderWithCover } from "~~/server/utils/queries/folders";
import { imageWithInstanceToDisplay } from "~~/server/utils/imageTransform";
import type { GalleryListItemResponse } from "~~/server/utils/galleryTransform";
import { galleryToResponse } from "~~/server/utils/galleryTransform";

/**
 * Get all galleries with cover image and image count
 * Sorted by: shoot_date DESC → created_at DESC
 */
export async function getAllGalleries(
  db: DrizzleD1Database<typeof schema>
): Promise<GalleryListItemResponse[]> {
  const galleries = await db
    .select()
    .from(schema.galleries)
    .orderBy(
      desc(schema.galleries.shootDate),
      desc(schema.galleries.createdAt)
    );

  const results: GalleryListItemResponse[] = [];

  for (const gallery of galleries) {
    let coverImage = null;
    let imageCount = 0;

    const folderData = await getFolderWithCover(db, gallery.folderId);

    if (folderData) {
      imageCount = folderData.folder.imageCount;

      if (folderData.coverImage) {
        coverImage = imageWithInstanceToDisplay({
          base: folderData.coverImage.base,
          instance: folderData.coverImage.instance,
          metadata: null,
          layout: null,
        });
      }
    }

    // Sum image counts from subfolders
    const subFolders = await db
      .select({
        imageCount: schema.imageFolders.imageCount,
      })
      .from(schema.imageFolders)
      .where(eq(schema.imageFolders.parentFolderId, gallery.folderId));

    for (const sub of subFolders) {
      imageCount += sub.imageCount;
    }

    results.push({
      ...galleryToResponse(gallery),
      cover_image: coverImage,
      image_count: imageCount,
    });
  }

  return results;
}

/**
 * Get a single gallery by slug
 */
export async function getGalleryBySlug(
  db: DrizzleD1Database<typeof schema>,
  slug: string
) {
  const [gallery] = await db
    .select()
    .from(schema.galleries)
    .where(eq(schema.galleries.slug, slug))
    .limit(1);

  return gallery || null;
}
