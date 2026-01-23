import { eq } from "drizzle-orm";
import { useDB } from "~~/server/db/client";
import * as schema from "~~/server/db/schema";
import { requireAuth } from "~~/server/utils/requireAuth";
import { logger } from "~/utils/logger";
import type { MultiUpdateRequest, MultiUpdateResponse } from "~~/types/api";

export default defineEventHandler(
  async (event): Promise<MultiUpdateResponse> => {
    await requireAuth(event);

    const body = await readBody<MultiUpdateRequest>(event);
    const { instance_ids, updates } = body;

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

    if (!updates || typeof updates !== "object") {
      throw createError({
        statusCode: 400,
        message: "updates object required",
      });
    }

    const db = useDB(event);

    let updated = 0;
    let failed = 0;
    const errors: Array<{ id: number; error: string }> = [];

    // Process each instance update
    for (const instanceId of instance_ids) {
      try {
        // Build update data
        const updateData: any = {
          updatedAt: new Date(),
        };

        // Add is_public if provided
        if (updates.is_public !== undefined) {
          updateData.isPublic = updates.is_public;
        }

        // Execute update
        await db
          .update(schema.imageInstances)
          .set(updateData)
          .where(eq(schema.imageInstances.id, instanceId));

        updated++;
      } catch (error: any) {
        failed++;
        errors.push({
          id: instanceId,
          error: error.message || "Unknown error",
        });
        logger.error(`Failed to update instance ${instanceId}`, error);
      }
    }

    return {
      success: true,
      updated,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
);
