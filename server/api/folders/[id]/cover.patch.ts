import { eq } from "drizzle-orm";
import { useDB } from "~~/server/db/client";
import * as schema from "~~/server/db/schema";
import { requireAuth } from "~~/server/utils/requireAuth";
import { getFolderById } from "~~/server/utils/queries/folders";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const db = useDB(event);
  const id = Number(getRouterParam(event, "id"));
  const body = await readBody<{ cover_image_id: number | null }>(event);

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid folder ID" });
  }

  // Verify folder exists
  const folder = await getFolderById(db, id);
  if (!folder) {
    throw createError({ statusCode: 404, message: "Folder not found" });
  }

  // If setting a specific cover, verify the image is in this folder or any child folder
  if (body.cover_image_id !== null && body.cover_image_id !== undefined) {
    // Get this folder's images
    const links = await db
      .select({ imageInstanceId: schema.folderImages.imageInstanceId })
      .from(schema.folderImages)
      .where(eq(schema.folderImages.folderId, id));

    let allInstanceIds = links.map((l) => l.imageInstanceId);

    // Also check child folders
    const childFolders = await db
      .select({ id: schema.imageFolders.id })
      .from(schema.imageFolders)
      .where(eq(schema.imageFolders.parentFolderId, id));

    for (const child of childFolders) {
      const childLinks = await db
        .select({ imageInstanceId: schema.folderImages.imageInstanceId })
        .from(schema.folderImages)
        .where(eq(schema.folderImages.folderId, child.id));

      allInstanceIds = allInstanceIds.concat(
        childLinks.map((l) => l.imageInstanceId)
      );
    }

    if (!allInstanceIds.includes(body.cover_image_id)) {
      throw createError({
        statusCode: 400,
        message: "Image is not in this folder or its sub-folders",
      });
    }
  }

  await db
    .update(schema.imageFolders)
    .set({
      coverImageId: body.cover_image_id ?? null,
      updatedAt: new Date(),
    })
    .where(eq(schema.imageFolders.id, id));

  return { success: true };
});
