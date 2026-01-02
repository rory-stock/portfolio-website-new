import { requireAuth } from "~~/server/utils/requireAuth";
import { getMetaImagePath, isValidMetaContext } from "~/utils/meta";
import { deleteR2Object } from "~/utils/r2";
import type {
  MetaImageDeleteRequest,
  MetaImageDeleteResponse,
} from "~~/types/api";
import { logger } from "~/utils/logger";

export default defineEventHandler(
  async (event): Promise<MetaImageDeleteResponse> => {
    await requireAuth(event);

    const body = await readBody<MetaImageDeleteRequest>(event);
    const { context } = body;

    // Validate context
    if (!isValidMetaContext(context)) {
      throw createError({
        statusCode: 400,
        message: "Invalid context",
      });
    }

    const r2Path = getMetaImagePath(context);

    try {
      await deleteR2Object(r2Path);

      return {
        success: true,
        deleted: true,
        path: r2Path,
      };
    } catch (error: any) {
      // If a file doesn't exist, that's fine - treat as success
      if (
        error.message?.includes("404") ||
        error.message?.includes("Not Found")
      ) {
        return {
          success: true,
          deleted: false,
          path: r2Path,
        };
      }

      logger.error("Meta image delete error", error);
      throw createError({
        statusCode: 500,
        message: error.message || "Failed to delete image",
      });
    }
  }
);
