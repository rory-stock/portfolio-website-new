import sharp from "sharp";
import { useDB } from "~~/server/db/client";
import { images } from "~~/server/db/schema";
import { getR2Client, getR2Object, deleteR2Object } from "~~/server/utils/r2";

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

    // Process with Sharp
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Extract EXIF data
    const exifData = metadata.exif
      ? JSON.stringify({
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          space: metadata.space,
          density: metadata.density,
          hasAlpha: metadata.hasAlpha,
          orientation: metadata.orientation,
        })
      : null;

    // Compress to JPEG, strip EXIF, target 2MB
    const TARGET_SIZE = 2 * 1024 * 1024;
    let quality = 90;
    let compressed = await image
      .rotate() // Auto-rotate based on EXIF
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    // Iteratively reduce quality if still too large
    while (compressed.length > TARGET_SIZE && quality > 60) {
      quality -= 10;
      compressed = await sharp(buffer)
        .rotate()
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
    }

    const finalMetadata = await sharp(compressed).metadata();
    const width = finalMetadata.width || 0;
    const height = finalMetadata.height || 0;
    const fileSize = compressed.length;

    // Upload compressed version back to R2
    const client = getR2Client();
    const config = useRuntimeConfig();
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");

    await client.send(
      new PutObjectCommand({
        Bucket: config.r2BucketName,
        Key: r2_path,
        Body: compressed,
        ContentType: "image/jpeg",
      })
    );

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
        exif_data: exifData,
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
        exif_data: exifData,
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
