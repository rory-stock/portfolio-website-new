import type { DrizzleD1Database } from "drizzle-orm/d1";
import { and, eq } from "drizzle-orm";
import * as schema from "~~/server/db/schema";
import { getFirstFolderImage, folderHasChildren } from "../queries/folders";
import { deleteImageInstance } from "./images";

/**
 * Update a folder's denormalized image_count
 */
export async function updateFolderImageCount(
  db: DrizzleD1Database<typeof schema>,
  folderId: number
) {
  const links = await db
    .select({ id: schema.folderImages.id })
    .from(schema.folderImages)
    .where(eq(schema.folderImages.folderId, folderId));

  await db
    .update(schema.imageFolders)
    .set({
      imageCount: links.length,
      updatedAt: new Date(),
    })
    .where(eq(schema.imageFolders.id, folderId));

  return links.length;
}

/**
 * Auto-select cover image for a folder
 * Sets cover to the first image (by sort order), or null if empty
 */
export async function autoSelectCover(
  db: DrizzleD1Database<typeof schema>,
  folderId: number
) {
  const firstImageId = await getFirstFolderImage(db, folderId);

  await db
    .update(schema.imageFolders)
    .set({
      coverImageId: firstImageId,
      updatedAt: new Date(),
    })
    .where(eq(schema.imageFolders.id, folderId));

  return firstImageId;
}

/**
 * Add an image instance to a folder
 * Updates image_count and auto-sets cover if the folder was empty
 */
export async function addImageToFolder(
  db: DrizzleD1Database<typeof schema>,
  folderId: number,
  imageInstanceId: number
) {
  // Check for duplicate
  const existing = await db
    .select({ id: schema.folderImages.id })
    .from(schema.folderImages)
    .where(
      and(
        eq(schema.folderImages.folderId, folderId),
        eq(schema.folderImages.imageInstanceId, imageInstanceId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Image already exists in this folder");
  }

  // Get the current folder to check if empty
  const [folder] = await db
    .select()
    .from(schema.imageFolders)
    .where(eq(schema.imageFolders.id, folderId));

  if (!folder) {
    throw new Error("Folder not found");
  }

  // Insert the link
  const [folderImage] = await db
    .insert(schema.folderImages)
    .values({
      folderId,
      imageInstanceId,
      createdAt: new Date(),
    })
    .returning();

  // Update image count
  await updateFolderImageCount(db, folderId);

  // Auto-set cover if the folder was empty (imageCount was 0)
  if (folder.imageCount === 0 || !folder.coverImageId) {
    await autoSelectCover(db, folderId);
  }

  return folderImage;
}

/**
 * Remove an image from a folder with smart cascade deletion
 *
 * 1. Remove from folder_images (unlink)
 * 2. Check if image_instance is used in other folders
 * 3. If not used elsewhere → delete the instance (which cascades to base if last)
 * 4. Update folder image_count
 * 5. If the deleted image was cover → auto-select the first remaining image
 */
export async function removeImageFromFolder(
  db: DrizzleD1Database<typeof schema>,
  folderId: number,
  imageInstanceId: number
) {
  // Get the current folder for cover check
  const [folder] = await db
    .select()
    .from(schema.imageFolders)
    .where(eq(schema.imageFolders.id, folderId));

  if (!folder) {
    throw new Error("Folder not found");
  }

  // 1. Remove the folder_images link
  const deleted = await db
    .delete(schema.folderImages)
    .where(
      and(
        eq(schema.folderImages.folderId, folderId),
        eq(schema.folderImages.imageInstanceId, imageInstanceId)
      )
    )
    .returning();

  if (deleted.length === 0) {
    throw new Error("Image not found in this folder");
  }

  // 2. Check if this image instance is used in other folders
  const otherFolderLinks = await db
    .select({ id: schema.folderImages.id })
    .from(schema.folderImages)
    .where(eq(schema.folderImages.imageInstanceId, imageInstanceId))
    .limit(1);

  let deletedInstance = false;
  let deletedBaseImage = false;
  let r2Path: string | null = null;

  // Only delete the instance if not used in any other folder
  if (otherFolderLinks.length === 0) {
    const result = await deleteImageInstance(db, imageInstanceId);
    deletedInstance = result.deletedInstance;
    deletedBaseImage = result.deletedBaseImage;
    r2Path = result.r2Path;
  }

  // 4. Update folder image count
  await updateFolderImageCount(db, folderId);

  // 5. If the deleted image was a cover, auto-select the new cover
  if (folder.coverImageId === imageInstanceId) {
    await autoSelectCover(db, folderId);
  }

  return {
    unlinked: true,
    deletedInstance,
    deletedBaseImage,
    r2Path,
  };
}

/**
 * Delete a folder
 * Validates no subfolders exist, then cascades to folder_images
 */
export async function deleteFolder(
  db: DrizzleD1Database<typeof schema>,
  folderId: number
) {
  // Check for subfolders
  const hasChildren = await folderHasChildren(db, folderId);

  if (hasChildren) {
    throw new Error(
      "Cannot delete folder with sub-folders. Delete sub-folders first."
    );
  }

  // Get all folder_images before deleting (for cascade clean-up)
  const folderImageLinks = await db
    .select()
    .from(schema.folderImages)
    .where(eq(schema.folderImages.folderId, folderId));

  // Smart cascade: remove each image from the folder
  const deletionResults = [];
  for (const link of folderImageLinks) {
    try {
      const result = await removeImageFromFolder(
        db,
        folderId,
        link.imageInstanceId
      );
      deletionResults.push(result);
    } catch (error) {
      // Continue with other deletions even if one fails
      deletionResults.push({ error, imageInstanceId: link.imageInstanceId });
    }
  }

  // Delete the folder itself (folder_images cascade handles links)
  await db
    .delete(schema.imageFolders)
    .where(eq(schema.imageFolders.id, folderId));

  return {
    success: true,
    imagesProcessed: folderImageLinks.length,
    deletionResults,
  };
}
