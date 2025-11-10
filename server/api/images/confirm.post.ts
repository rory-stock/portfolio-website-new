import imageSize from "image-size";
import { useDB } from "~~/server/db/client";
import { images } from "~~/server/db/schema";
import { getR2Object, deleteR2Object } from "~~/server/utils/r2";

const ALLOWED_CONTEXTS = ["home", "journal", "info"] as const;

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const body = await readBody(event);
  const { r2_path, context, alt, additionalContexts } = body as {
    r2_path: string;
    context: (typeof ALLOWED_CONTEXTS)[number];
    alt?: string;
    additionalContexts?: string[];
  };

  if (!r2_path || !context) {
    throw createError({
      statusCode: 400,
      message: "r2_path and context required",
    });
  }

  if (!ALLOWED_CONTEXTS.includes(context)) {
    throw createError({ statusCode: 400, message: "Invalid context" });
  }

  // Validate additional contexts
  const additionalCtx = additionalContexts || [];
  for (const ctx of additionalCtx) {
    if (!ALLOWED_CONTEXTS.includes(ctx as any) || ctx === context) {
      throw createError({
        statusCode: 400,
        message: "Invalid additional context",
      });
    }
  }

  try {
    // Fetch the uploaded file from R2
    const r2Object = await getR2Object(r2_path);

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
    const url = `${config.r2PublicUrl}/${r2_path}`;
    const filename = r2_path.split("/").pop() || "unknown.jpg";

    // Insert DB records
    const recordsToInsert = [
      // Primary context
      {
        context,
        r2_path,
        url,
        alt: alt || "",
        width,
        height,
        file_size: fileSize,
        original_filename: filename,
        is_primary: false,
        uploaded_at: new Date(),
      },
      // Additional contexts
      ...additionalCtx.map((ctx: string) => ({
        context: ctx,
        r2_path,
        url,
        alt: alt || "",
        width,
        height,
        file_size: fileSize,
        original_filename: filename,
        is_primary: false,
        uploaded_at: new Date(),
      })),
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
      await deleteR2Object(r2_path);
    } catch (e) {
      console.error("Failed to cleanup R2 file:", e);
    }

    throw createError({
      statusCode: 500,
      message: error.message || "Failed to process image",
    });
  }
});
