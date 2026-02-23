import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import { getFolderById } from "~~/server/utils/queries/folders";
import { addImageToFolder } from "~~/server/utils/mutations/folders";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const db = useDB(event);
  const id = Number(getRouterParam(event, "id"));
  const body = await readBody<{ image_instance_id: number }>(event);

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid folder ID" });
  }

  if (!body.image_instance_id) {
    throw createError({
      statusCode: 400,
      message: "image_instance_id required",
    });
  }

  // Verify folder exists
  const folder = await getFolderById(db, id);
  if (!folder) {
    throw createError({ statusCode: 404, message: "Folder not found" });
  }

  try {
    await addImageToFolder(db, id, body.image_instance_id);
  } catch (error: any) {
    if (error.message === "Image already exists in this folder") {
      throw createError({ statusCode: 409, message: error.message });
    }
    throw error;
  }

  return { success: true };
});
