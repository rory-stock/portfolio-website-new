import { resolveFolder } from "~~/server/utils/resolveFolder";
import { deleteFolder } from "~~/server/utils/mutations/folders";
import { deleteR2Object } from "~/utils/r2";
import { logger } from "~/utils/logger";

export default defineEventHandler(async (event) => {
  const { db, folder } = await resolveFolder(event);

  try {
    const result = await deleteFolder(db, folder.id);

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
            { r2Error }
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
