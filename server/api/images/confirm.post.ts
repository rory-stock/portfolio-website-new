import { useDB } from "~~/server/db/client";
import { images } from "~~/server/db/schema";
import { getR2Object, deleteR2Object } from "~/utils/r2";
import { VALID_CONTEXTS, isValidContext } from "~/utils/context";
import {
  createImageRecord,
} from "~/utils/imageFields";
import { requireAuth } from "~~/server/utils/requireAuth";
import { FILE_CONSTRAINTS } from "~/utils/constants";
import { formatFileSize } from "~/utils/format";
import { logger } from "~/utils/logger";
import type { ImageConfirmRequest, ImageConfirmResponse } from "~~/types/api";

export default defineEventHandler(async (event): Promise<ImageConfirmResponse> => {
  await requireAuth(event);

  const body = await readBody<ImageConfirmRequest>(event);

  if (!body.r2_path || !body.context) {
    throw createError({
      statusCode: 400,
      message: "r2_path and context required",
    });
  }

  if (!isValidContext(body.context)) {
    throw createError({
      statusCode: 400,
      message: `Invalid context. Must be one of: ${VALID_CONTEXTS.join(", ")}`,
    });
  }

  // Validate additional contexts
  const additionalCtx = body.additionalContexts || [];
  for (const ctx of additionalCtx) {
    if (!isValidContext(ctx) || ctx === body.context) {
      throw createError({
        statusCode: 400,
        message: `Invalid additional context. Must be one of: ${VALID_CONTEXTS.join(", ")} and different from primary context`,
      });
    }
  }

  try {
    // Fetch the uploaded file from R2
    const r2Object = await getR2Object(body.r2_path);

    if (!r2Object) {
      throw createError({
        statusCode: 404,
        message: "File not found in R2",
      });
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of r2Object as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Validate file size
    if (buffer.length > FILE_CONSTRAINTS.MAX_FILE_SIZE) {
      // Cleanup: delete from R2
      await deleteR2Object(body.r2_path);
      throw createError({
        statusCode: 400,
        message: "File too large. Maximum size is" + formatFileSize(FILE_CONSTRAINTS.MAX_FILE_SIZE) + " bytes.",
      });
    }

    const config = useRuntimeConfig();

    // Create records using a centralized helper
    const recordsToInsert = [
      createImageRecord(body.context, body, buffer, config.r2PublicUrl),
      ...additionalCtx.map((ctx: string) =>
        createImageRecord(ctx, body, buffer, config.r2PublicUrl)
      ),
    ];

    const db = useDB(event);
    const inserted = await db
      .insert(images)
      .values(recordsToInsert)
      .returning();

    return {
      success: true,
      images: inserted,
    };
  } catch (error: any) {
    logger.error("Image processing error", error);

    // Cleanup: try to delete from R2 on failure
    try {
      await deleteR2Object(body.r2_path);
    } catch (e) {
      logger.error("Failed to cleanup R2 file after processing error", e);
    }

    throw createError({
      statusCode: 500,
      message: error.message || "Failed to process image",
    });
  }
});
