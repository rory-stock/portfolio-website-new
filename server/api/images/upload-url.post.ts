import { z } from "zod";
import { generatePresignedUploadUrl } from "~/utils/r2";
import { VALID_CONTEXTS } from "~/utils/context";
import { requireAuth } from "~~/server/utils/requireAuth";
import { fileConstraints, VALID_IMAGE_EXTENSIONS } from "~/utils/constants";
import { getValidImageFormats } from "~/utils/format";
import type { ImageUploadUrlResponse } from "~~/types/api";

const FILENAME_REGEX = /^[a-zA-Z0-9\-.]+$/;

const bodySchema = z.object({
  filename: z
    .string()
    .min(1, "Filename is required")
    .regex(
      FILENAME_REGEX,
      "Invalid filename. Only letters, numbers, hyphens, and dots allowed"
    )
    .refine(
      (name) => {
        const ext = name.toLowerCase().split(".").pop();
        return ext && VALID_IMAGE_EXTENSIONS.includes(ext as any);
      },
      {
        message: `Invalid file type. Only ${getValidImageFormats()} allowed`,
      }
    ),
  context: z.enum(VALID_CONTEXTS, {
    error: `Invalid context. Must be one of: ${VALID_CONTEXTS.join(", ")}`,
  }),
  fileSize: z
    .number()
    .max(fileConstraints.maxFileSize, "File too large. Maximum size is 60MB")
    .optional(),
});

function generateHash(length: number = 6): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(36))
    .join("")
    .slice(0, length);
}

export default defineEventHandler(
  async (event): Promise<ImageUploadUrlResponse> => {
    await requireAuth(event);

    const { filename, context } = await readValidatedBody(
      event,
      bodySchema.parse
    );

    // Generate R2 path with hash
    const hash = generateHash(6);
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf("."));
    const r2_path = `${context}/${nameWithoutExt}-${hash}.jpg`;

    // Generate presigned URL
    const uploadUrl = await generatePresignedUploadUrl(r2_path);

    return {
      uploadUrl,
      r2_path,
    };
  }
);
