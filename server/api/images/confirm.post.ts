import imageSize from "image-size";
import { useDB } from "~~/server/db/client";
import { images } from "~~/server/db/schema";
import { getR2Object, deleteR2Object } from "~~/server/utils/r2";
import {
  VALID_CONTEXTS,
  isValidContext,
  type Context,
} from "~~/server/utils/context";
import {
  createImageRecord,
  type ImageUploadData,
  type ImageConfirmBody,
} from "~~/server/utils/imageFields";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const body = await readBody<ImageConfirmBody>(event);

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

    const dimensions = imageSize(buffer);
    const width = dimensions.width || 0;
    const height = dimensions.height || 0;
    const fileSize = buffer.length;

    const config = useRuntimeConfig();
    const url = `${config.r2PublicUrl}/${body.r2_path}`;
    const filename = body.r2_path.split("/").pop() || "unknown.jpg";

    // Prepare upload data from body and file metadata
    const uploadData: ImageUploadData = {
      r2_path: body.r2_path,
      url,
      width,
      height,
      file_size: fileSize,
      original_filename: filename,
      alt: body.alt,
      description: body.description,
      is_primary: body.is_primary,
      is_public: body.is_public,
    };

    // Create records using centralized helper
    const recordsToInsert = [
      createImageRecord(body.context, uploadData),
      ...additionalCtx.map((ctx: string) => createImageRecord(ctx, uploadData)),
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
    console.error("Image processing error:", error);

    // Cleanup: try to delete from R2 on failure
    try {
      await deleteR2Object(body.r2_path);
    } catch (e) {
      console.error("Failed to cleanup R2 file:", e);
    }

    throw createError({
      statusCode: 500,
      message: error.message || "Failed to process image",
    });
  }
});
