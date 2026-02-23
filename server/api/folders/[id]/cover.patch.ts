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

  // If setting a specific cover, verify the image is in this folder
  if (body.cover_image_id !== null && body.cover_image_id !== undefined) {
    const [link] = await db
      .select()
      .from(schema.folderImages)
      .where(eq(schema.folderImages.folderId, id))
      .limit(1);

    // More thorough check: make sure this specific instance is in the folder
    const links = await db
      .select()
      .from(schema.folderImages)
      .where(eq(schema.folderImages.folderId, id));

    const instanceIds = links.map((l) => l.imageInstanceId);

    if (!instanceIds.includes(body.cover_image_id)) {
      throw createError({
        statusCode: 400,
        message: "Image is not in this folder",
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
