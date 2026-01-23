import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import { deleteImageInstance } from "~~/server/utils/mutations";
import { deleteR2Object } from "~/utils/r2";
import { logger } from "~/utils/logger";
import type { MultiDeleteRequest, MultiDeleteResponse } from "~~/types/api";

export default defineEventHandler(
  async (event): Promise<MultiDeleteResponse> => {
    await requireAuth(event);

    const body = await readBody<MultiDeleteRequest>(event);
    const { instance_ids } = body;

    // Validation
    if (
      !instance_ids ||
      !Array.isArray(instance_ids) ||
      instance_ids.length === 0
    ) {
      throw createError({
        statusCode: 400,
        message: "instance_ids array required and cannot be empty",
      });
    }

    const db = useDB(event);

    // Process all deletions in parallel
    const results = await Promise.allSettled(
      instance_ids.map(async (instanceId) => {
        // Delete instance (may also delete base image if last instance)
        const result = await deleteImageInstance(db, instanceId);

        // If the base image was deleted, also delete from R2
        if (result.deletedBaseImage && result.r2Path) {
          try {
            await deleteR2Object(result.r2Path);
          } catch (r2Error: any) {
            logger.error(
              `R2 deletion failed for ${result.r2Path} (DB record already deleted)`,
              r2Error
            );
          }
        }

        return { instanceId, success: true };
      })
    );

    // Count successes and failures
    let deleted = 0;
    let failed = 0;
    const errors: Array<{ id: number; error: string }> = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        deleted++;
      } else {
        failed++;
        errors.push({
          id: instance_ids[index],
          error: result.reason?.message || "Unknown error",
        });
        logger.error(
          `Failed to delete instance ${instance_ids[index]}`,
          result.reason
        );
      }
    });

    return {
      success: true,
      deleted,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
);
