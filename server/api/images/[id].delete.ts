import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import type { ImageDeleteResponse } from "~~/types/api";
import { getImageWithInstance } from "~~/server/utils/queries";
import { deleteImageInstance } from "~~/server/utils/mutations";
import { deleteR2Object } from "~/utils/r2";
import { logger } from "~/utils/logger";

export default defineEventHandler(
  async (event): Promise<ImageDeleteResponse> => {
    await requireAuth(event);

    const idParam = getRouterParam(event, "id");
    const id = parseInt(idParam || "");

    if (!id || isNaN(id)) {
      throw createError({ statusCode: 400, message: "Invalid image ID" });
    }

    const db = useDB(event);

    // Get the image data before deletion
    const imageData = await getImageWithInstance(db, id);

    if (!imageData) {
      throw createError({ statusCode: 404, message: "Image not found" });
    }

    // Delete the instance (and check if the base image needs deletion)
    try {
      const result = await deleteImageInstance(db, id);

      // If this was the last instance, also delete from R2
      if (result.deletedBaseImage && result.r2Path) {
        try {
          await deleteR2Object(result.r2Path);
        } catch (error) {
          logger.error("R2 Delete Error - DB record already deleted", error);
          // Don't throw - DB record is already deleted
        }
      }

      return { success: true, id };
    } catch (error: any) {
      logger.error("Image deletion error", error);
      throw createError({
        statusCode: 500,
        message: error.message || "Failed to delete image",
      });
    }
  }
);
