import { requireAuth } from "~~/server/utils/requireAuth";
import { getMetaImagePath, isValidMetaContext } from "~/utils/meta";
import { metaImageConstraints, VALID_IMAGE_TYPES } from "~/utils/constants";
import { generatePresignedUploadUrl } from "~/utils/r2";
import imageSize from "image-size";
import type { MetaImageUploadResponse } from "~~/types/api";
import { logger } from "~/utils/logger";

export default defineEventHandler(
  async (event): Promise<MetaImageUploadResponse> => {
    await requireAuth(event);

    // Parse multipart form data
    const formData = await readMultipartFormData(event);

    if (!formData) {
      throw createError({
        statusCode: 400,
        message: "No file uploaded",
      });
    }

    // Extract fields
    const fileField = formData.find((field) => field.name === "file");
    const contextField = formData.find((field) => field.name === "context");

    if (!fileField || !contextField) {
      throw createError({
        statusCode: 400,
        message: "file and context are required",
      });
    }

    const context = contextField.data.toString();
    const buffer = fileField.data;

    // Validate context
    if (!isValidMetaContext(context)) {
      throw createError({
        statusCode: 400,
        message:
          "Invalid context. Must be a page context (overview, events, journal, info)",
      });
    }

    // Validate a file type by checking magic bytes
    const fileType = fileField.type || "";
    if (!VALID_IMAGE_TYPES.includes(fileType as any)) {
      throw createError({
        statusCode: 400,
        message: "Invalid file type. Only JPEG and WebP allowed",
      });
    }

    // Validate dimensions - must be exactly Twitter size (1200×675)
    const dimensions = imageSize(buffer);

    if (
      dimensions.width !== metaImageConstraints.width ||
      dimensions.height !== metaImageConstraints.height
    ) {
      throw createError({
        statusCode: 400,
        message: `Invalid dimensions. Must be exactly ${metaImageConstraints.width}×${metaImageConstraints.height}px for ${metaImageConstraints.label}, got ${dimensions.width}×${dimensions.height}px`,
      });
    }

    // Generate R2 path
    const r2Path = getMetaImagePath(context);

    try {
      // Get presigned URL
      const uploadUrl = await generatePresignedUploadUrl(r2Path);

      // Upload to R2 (this will overwrite if a file exists)
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: new Uint8Array(buffer),
        headers: {
          "Content-Type": fileType,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`R2 upload failed: ${uploadResponse.statusText}`);
      }

      const config = useRuntimeConfig();
      const publicUrl = `${config.r2PublicUrl}/${r2Path}`;

      return {
        success: true,
        url: publicUrl,
        context,
      };
    } catch (error: any) {
      logger.error("Meta image upload error", error);
      throw createError({
        statusCode: 500,
        message: error.message || "Failed to upload meta image",
      });
    }
  }
);
