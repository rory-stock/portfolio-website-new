import { z } from "zod";
import { useDB } from "~~/server/db/client";
import { getR2Object, deleteR2Object } from "~/utils/r2";
import { VALID_CONTEXTS } from "~/utils/context";
import { requireAuth } from "~~/server/utils/requireAuth";
import { fileConstraints } from "~/utils/constants";
import { formatFileSize } from "~/utils/format";
import { logger } from "~/utils/logger";
import type { ImageConfirmResponse } from "~~/types/api";
import {
  createBaseImageRecord,
  createImageInstanceRecord,
} from "~~/server/utils/mutations";
import * as schema from "~~/server/db/schema";

const contextEnum = z.enum(VALID_CONTEXTS, {
  error: `Invalid context. Must be one of: ${VALID_CONTEXTS.join(", ")}`,
});

const bodySchema = z.object({
  r2_path: z.string().min(1, "r2_path is required"),
  context: contextEnum,
  alt: z.string().optional().default(""),
  description: z.string().optional(),
  is_primary: z.boolean().optional().default(false),
  is_public: z.boolean().optional().default(true),
  additionalContexts: z.array(contextEnum).optional().default([]),
});

export default defineEventHandler(
  async (event): Promise<ImageConfirmResponse> => {
    await requireAuth(event);

    const body = await readValidatedBody(event, bodySchema.parse);

    // Validate additional contexts don't include primary
    const duplicateContexts = body.additionalContexts.filter(
      (c) => c === body.context
    );
    if (duplicateContexts.length > 0) {
      throw createError({
        statusCode: 400,
        message: "Additional contexts must be different from primary context",
      });
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

      if (!baseImage) {
        throw createError({
          statusCode: 500,
          message: "Failed to create base image record",
        });
      }

      // Create instances for primary context + additional contexts
      const allContexts = [body.context, ...body.additionalContexts];
      const instances = await Promise.all(
        allContexts.map((ctx, index) =>
          createImageInstanceRecord(db, baseImage.id, ctx, {
            isPublic: body.is_public,
            isPrimary: index === 0 ? body.is_primary : false,
          })
        )
      );

      // Filter out any undefined results
      const validInstances = instances.filter(
        (inst): inst is NonNullable<typeof inst> => inst != null
      );

      // Create metadata if description provided
      if (body.description && validInstances.length > 0) {
        const metadataInserts = validInstances.map((inst) => ({
          imageInstanceId: inst.id,
          description: body.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await db.insert(schema.imageMetadata).values(metadataInserts);
      }

      return {
        success: true,
        images: validInstances.map((inst) => ({ id: inst.id })),
      };
    } catch (error: any) {
      // Don't re-wrap createError responses
      if (error.statusCode) throw error;

      logger.error("Image processing error", error);

      try {
        await deleteR2Object(body.r2_path);
      } catch (e) {
        logger.error("Failed to cleanup R2 file after processing error", { e });
      }

      throw createError({
        statusCode: 500,
        message: error.message || "Failed to process image",
      });
    }
  }
);
