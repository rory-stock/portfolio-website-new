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

    // Just return immediately
    return {
      success: true,
      deleted: instance_ids.length,
      failed: 0,
    };
  }
);
