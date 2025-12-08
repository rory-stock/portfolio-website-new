import { generatePresignedUploadUrl } from "~~/server/utils/r2";
import {
  VALID_CONTEXTS,
  isValidContext,
  type Context,
} from "~~/server/utils/context";

console.log("Upload URL endpoint hit - using crypto hash");

function generateHash(length: number = 6): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(36))
    .join("")
    .slice(0, length);
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const body = await readBody(event);
  const { filename, context, fileSize } = body as {
    filename: string;
    context: Context;
    fileSize?: number;
  };

  if (!filename || !context) {
    throw createError({
      statusCode: 400,
      message: "filename and context required",
    });
  }

  const MAX_FILE_SIZE = 60 * 1024 * 1024; // 60MB
  if (fileSize && fileSize > MAX_FILE_SIZE) {
    throw createError({
      statusCode: 400,
      message: "File too large. Maximum size is 60MB",
    });
  }

  if (!isValidContext(context)) {
    throw createError({
      statusCode: 400,
      message: `Invalid context. Must be one of: ${VALID_CONTEXTS.join(", ")}`,
    });
  }

  // Validate filename
  const filenameRegex = /^[a-zA-Z0-9\-\.]+$/;
  if (!filenameRegex.test(filename)) {
    throw createError({
      statusCode: 400,
      message:
        "Invalid filename. Only letters, numbers, hyphens, and dots allowed",
    });
  }

  const ext = filename.toLowerCase().split(".").pop();
  const validExts = ["jpg", "jpeg", "png", "webp"];
  if (!ext || !validExts.includes(ext)) {
    throw createError({
      statusCode: 400,
      message: "Invalid file type. Only JPG, PNG, WebP allowed",
    });
  }

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
});
