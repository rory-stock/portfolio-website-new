import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import { deleteImageInstance } from "~~/server/utils/mutations";
import { deleteR2Object } from "~/utils/r2";
import { logger } from "~/utils/logger";
import type { MultiDeleteRequest, MultiDeleteResponse } from "~~/types/api";

export default defineEventHandler(
  async (event): Promise<MultiDeleteResponse> => {
    await requireAuth(event);

    // Skip body parsing
    // const body = await readBody<MultiDeleteRequest>(event);

    return {
      success: true,
      deleted: 0,
      failed: 0,
    };
  }
);
