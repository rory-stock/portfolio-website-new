// server/api/images.post.ts
import { nanoid } from "nanoid";
import sharp from "sharp";

import { useDB } from "~~/server/db/client";
import { images } from "~~/server/db/schema";

const ALLOWED_CONTEXTS = ["home", "journal", "info"] as const;
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const TARGET_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const form = await readMultipartFormData(event);
  if (!form) {
    throw createError({ statusCode: 400, message: "No files uploaded" });
  }

  // Extract form fields
  const files = form.filter((item) => item.name === "files");
  const contextField = form.find((item) => item.name === "context");
  const additionalContextsField = form.find(
    (item) => item.name === "additionalContexts"
  );
  const altField = form.find((item) => item.name === "alt");

  if (files.length === 0) {
    throw createError({
      statusCode: 400,
      message: "At least one file required",
    });
  }

  const context =
    contextField?.data?.toString() as (typeof ALLOWED_CONTEXTS)[number];
  if (!context || !ALLOWED_CONTEXTS.includes(context)) {
    throw createError({
      statusCode: 400,
      message: "Invalid context. Must be: home, journal, or info",
    });
  }

  const additionalContexts = additionalContextsField?.data?.toString()
    ? JSON.parse(additionalContextsField.data.toString())
    : [];

  // Validate additional contexts
  for (const ctx of additionalContexts) {
    if (!ALLOWED_CONTEXTS.includes(ctx) || ctx === context) {
      throw createError({
        statusCode: 400,
        message: "Invalid additional context",
      });
    }
  }

  const alt = altField?.data?.toString() || "";
  const results = [];

  for (const fileEntry of files) {
    if (!fileEntry.data) continue;

    // Validate file size
    if (fileEntry.data.length > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 400,
        message: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
    }

    // Validate filename and type
    const filename = fileEntry.filename || "untitled.jpg";
    const ext = filename.toLowerCase().split(".").pop();
    const validExts = ["jpg", "jpeg", "png", "webp"];
    if (!ext || !validExts.includes(ext)) {
      throw createError({
        statusCode: 400,
        message: "Invalid file type. Only JPG, PNG, WebP allowed",
      });
    }
    const filenameRegex = /^[a-zA-Z0-9\-\.]+$/;
    if (!filenameRegex.test(filename)) {
      throw createError({
        statusCode: 400,
        message:
          "Invalid filename. Only letters, numbers, hyphens, and dots allowed",
      });
    }

    // Extract EXIF and metadata
    const image = sharp(fileEntry.data);
    const metadata = await image.metadata();

    // Parse EXIF data
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
    let quality = 90;
    let compressed = await image
      .rotate() // Auto-rotate based on EXIF
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    // Iteratively reduce quality if still too large
    while (compressed.length > TARGET_SIZE && quality > 60) {
      quality -= 10;
      compressed = await sharp(fileEntry.data)
        .rotate()
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
    }

    const finalMetadata = await sharp(compressed).metadata();
    const width = finalMetadata.width || 0;
    const height = finalMetadata.height || 0;
    const fileSize = compressed.length;

    // Generate R2 path with hash
    const hash = nanoid(6);
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf("."));
    const r2_path = `${context}/${nameWithoutExt}-${hash}.jpg`;
    const url = `https://images.rorystock.com/rebuild/${r2_path}`;

    // Upload to R2
    try {
      const { IMAGES } = event.context.cloudflare.env;
      await IMAGES.put(r2_path, compressed.buffer, {
        httpMetadata: {
          contentType: "image/jpeg",
        },
      });
    } catch (error) {
      console.error("R2 Upload Error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      throw createError({
        statusCode: 500,
        message: `Failed to upload to storage: ${message}`,
      });
    }

    // Insert DB records
    const recordsToInsert = [
      // Primary context
      {
        context,
        r2_path,
        url,
        alt,
        width,
        height,
        file_size: fileSize,
        original_filename: filename,
        exif_data: exifData,
        is_primary: true,
        uploaded_at: new Date(),
      },
      // Additional contexts
      ...additionalContexts.map((ctx: string) => ({
        context: ctx,
        r2_path,
        url,
        alt,
        width,
        height,
        file_size: fileSize,
        original_filename: filename,
        exif_data: exifData,
        is_primary: false,
        uploaded_at: new Date(),
      })),
    ];

    try {
      const db = useDB(event);
      const inserted = await db
        .insert(images)
        .values(recordsToInsert)
        .returning();
      results.push(...inserted);
    } catch (error) {
      // Rollback: delete from R2
      const { IMAGES } = event.context.cloudflare.env;
      await IMAGES.delete(r2_path);
      throw createError({
        statusCode: 500,
        message: "Failed to save to database",
      });
    }
  }

  return results;
});
