import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import { getFolderById } from "~~/server/utils/queries/folders";
import { removeImageFromFolder } from "~~/server/utils/mutations/folders";
import { deleteR2Object } from "~/utils/r2";
import { logger } from "~/utils/logger";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const db = useDB(event);
  const folderId = Number(getRouterParam(event, "id"));
  const imageId = Number(getRouterParam(event, "imageId"));

  if (!folderId || isNaN(folderId) || !imageId || isNaN(imageId)) {
    throw createError({
      statusCode: 400,
      message: "Invalid folder ID or image ID",
    });
  }

  // Verify folder exists
  const folder = await getFolderById(db, folderId);
  if (!folder) {
    throw createError({ statusCode: 404, message: "Folder not found" });
  }

  try {
    const result = await removeImageFromFolder(db, folderId, imageId);

    // If the base image was deleted, also clean up R2
    if (result.deletedBaseImage && result.r2Path) {
      try {
        await deleteR2Object(result.r2Path);
      } catch (r2Error) {
        logger.error(
          `R2 deletion failed for ${result.r2Path} (DB record already deleted)`,
          { r2Error }
        );
      }
    }

    return {
      success: true,
      unlinked: result.unlinked,
      deleted_instance: result.deletedInstance,
      deleted_base_image: result.deletedBaseImage,
    };
  } catch (error: any) {
    if (error.message === "Image not found in this folder") {
      throw createError({ statusCode: 404, message: error.message });
    }
    throw error;
  }
});
