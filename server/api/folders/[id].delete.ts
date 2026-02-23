import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import { getFolderById } from "~~/server/utils/queries/folders";
import { deleteFolder } from "~~/server/utils/mutations/folders";
import { deleteR2Object } from "~/utils/r2";
import { logger } from "~/utils/logger";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const db = useDB(event);
  const id = Number(getRouterParam(event, "id"));

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid folder ID" });
  }

  // Verify folder exists
  const folder = await getFolderById(db, id);
  if (!folder) {
    throw createError({ statusCode: 404, message: "Folder not found" });
  }

  try {
    const result = await deleteFolder(db, id);

    // Clean up R2 for any fully deleted base images
    for (const deletion of result.deletionResults) {
      if (
        "r2Path" in deletion &&
        deletion.r2Path &&
        deletion.deletedBaseImage
      ) {
        try {
          await deleteR2Object(deletion.r2Path);
        } catch (r2Error) {
          logger.error(
            `R2 deletion failed for ${deletion.r2Path} during folder delete`,
            r2Error
          );
        }
      }
    }

    return {
      success: true,
      images_processed: result.imagesProcessed,
    };
  } catch (error: any) {
    if (error.message?.includes("sub-folders")) {
      throw createError({ statusCode: 409, message: error.message });
    }
    throw error;
  }
});
