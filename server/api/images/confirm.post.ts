import { useDB } from "~~/server/db/client";
import { getR2Object, deleteR2Object } from "~/utils/r2";
import { VALID_CONTEXTS, isValidContext } from "~/utils/context";
import { requireAuth } from "~~/server/utils/requireAuth";
import { fileConstraints } from "~/utils/constants";
import { formatFileSize } from "~/utils/format";
import { logger } from "~/utils/logger";
import type { ImageConfirmRequest, ImageConfirmResponse } from "~~/types/api";
import {
  createBaseImageRecord,
  createImageInstanceRecord,
} from "~~/server/utils/mutations";
import * as schema from "~~/server/db/schema";

export default defineEventHandler(
  async (event): Promise<ImageConfirmResponse> => {
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
      if (buffer.length > fileConstraints.maxFileSize) {
        // Cleanup: delete from R2
        await deleteR2Object(body.r2_path);
        throw createError({
          statusCode: 400,
          message:
            "File too large. Maximum size is " +
            formatFileSize(fileConstraints.maxFileSize),
        });
      }

      const config = useRuntimeConfig();
      const db = useDB(event);

      // Create a base image (once)
      const baseImage = await createBaseImageRecord(
        db,
        {
          r2_path: body.r2_path,
          buffer,
          alt: body.alt,
        },
        config.r2PublicUrl
      );

      // Create instances for primary context + additional contexts
      const allContexts = [body.context, ...additionalCtx];
      const instances = await Promise.all(
        allContexts.map((ctx, index) =>
          createImageInstanceRecord(db, baseImage.id, ctx, {
            isPublic: body.is_public ?? true,
            isPrimary: index === 0 ? (body.is_primary ?? false) : false,
          })
        )
      );

      // Create metadata if description provided
      if (body.description) {
        const metadataInserts = instances.map((inst) => ({
          imageInstanceId: inst.id,
          description: body.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await db.insert(schema.imageMetadata).values(metadataInserts);
      }

      // Return instances with their IDs
      return {
        success: true,
        images: instances.map((inst) => ({ id: inst.id })),
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
  }
);
