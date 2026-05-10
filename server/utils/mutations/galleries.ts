import type { DrizzleD1Database } from "drizzle-orm/d1";
import { eq, and, isNull } from "drizzle-orm";
import * as schema from "~~/server/db/schema";
import type { NewGallery } from "~~/types/database";
import { generateUniqueSlug } from "~/utils/slug";

/**
 * Create a gallery record with an auto-created linked folder
 */
export async function createGalleryRecord(
  db: DrizzleD1Database<typeof schema>,
  data: {
    name: string;
    clientName?: string;
    shootDate?: string;
  }
) {
  // Generate globally unique gallery slug
  const allGalleries = await db
    .select({ slug: schema.galleries.slug })
    .from(schema.galleries);

  const existingSlugs = allGalleries.map((g) => g.slug);
  const slug = generateUniqueSlug(data.name, existingSlugs);

  // Generate unique folder slug among top-level gallery folders
  const folderSiblings = await db
    .select({ slug: schema.imageFolders.slug })
    .from(schema.imageFolders)
    .where(
      and(
        isNull(schema.imageFolders.parentFolderId),
        eq(schema.imageFolders.folderType, "gallery")
      )
    );

  const existingFolderSlugs = folderSiblings.map((s) => s.slug);
  const folderSlug = generateUniqueSlug(data.name, existingFolderSlugs);

  const now = new Date();

  // Create the folder
  const [folder] = await db
    .insert(schema.imageFolders)
    .values({
      name: data.name,
      slug: folderSlug,
      parentFolderId: null,
      folderType: "gallery",
      isPublic: false,
      imageCount: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (!folder) {
    throw createError({
      statusCode: 500,
      message: "Failed to create folder for gallery",
    });
  }

  // Create the gallery
  const insertData: NewGallery = {
    name: data.name,
    slug,
    folderId: folder.id,
    clientName: data.clientName || null,
    shootDate: data.shootDate || null,
    createdAt: now,
    updatedAt: now,
  };

  const [gallery] = await db
    .insert(schema.galleries)
    .values(insertData)
    .returning();

  return gallery;
}

/**
 * Update a gallery record
 */
export async function updateGallery(
  db: DrizzleD1Database<typeof schema>,
  id: number,
  data: Partial<{
    name: string;
    clientName: string | null;
    shootDate: string | null;
  }>
) {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.clientName !== undefined) updateData.clientName = data.clientName;
  if (data.shootDate !== undefined) updateData.shootDate = data.shootDate;

  // Regenerate slug if name changed
  if (data.name) {
    const allGalleries = await db
      .select({ slug: schema.galleries.slug, id: schema.galleries.id })
      .from(schema.galleries);

    const existingSlugs = allGalleries
      .filter((g) => g.id !== id)
      .map((g) => g.slug);

    updateData.slug = generateUniqueSlug(data.name, existingSlugs);
  }

  const [gallery] = await db
    .update(schema.galleries)
    .set(updateData)
    .where(eq(schema.galleries.id, id))
    .returning();

  return gallery;
}

/**
 * Delete a gallery and its linked folder.
 * Requires all subfolders to be deleted first.
 */
export async function deleteGallery(
  db: DrizzleD1Database<typeof schema>,
  id: number
) {
  // Get the gallery to find its folder
  const [gallery] = await db
    .select({ folderId: schema.galleries.folderId })
    .from(schema.galleries)
    .where(eq(schema.galleries.id, id));

  if (!gallery) {
    throw createError({
      statusCode: 404,
      message: "Gallery not found",
    });
  }

  // Check for subfolders before deleting
  const subFolders = await db
    .select({ id: schema.imageFolders.id })
    .from(schema.imageFolders)
    .where(eq(schema.imageFolders.parentFolderId, gallery.folderId))
    .limit(1);

  if (subFolders.length > 0) {
    throw createError({
      statusCode: 409,
      message:
        "Cannot delete gallery with sub-folders. Delete sub-folders first.",
    });
  }

  // Delete the gallery record
  await db.delete(schema.galleries).where(eq(schema.galleries.id, id));

  // Delete the root folder (cascades to folder_images)
  await db
    .delete(schema.imageFolders)
    .where(eq(schema.imageFolders.id, gallery.folderId));

  return { success: true };
}
