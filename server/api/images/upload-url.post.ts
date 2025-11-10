import { nanoid } from "nanoid";
import { generatePresignedUploadUrl } from "~~/server/utils/r2";

const ALLOWED_CONTEXTS = ["home", "journal", "info"] as const;

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const body = await readBody(event);
  const { filename, context } = body as {
    filename: string;
    context: (typeof ALLOWED_CONTEXTS)[number];
  };

  if (!filename || !context) {
    throw createError({
      statusCode: 400,
      message: "filename and context required",
    });
  }

  if (!ALLOWED_CONTEXTS.includes(context)) {
    throw createError({
      statusCode: 400,
      message: "Invalid context. Must be: home, journal, or info",
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
  const hash = nanoid(6);
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf("."));
  const r2_path = `${context}/${nameWithoutExt}-${hash}.jpg`;

  // Generate presigned URL
  const uploadUrl = await generatePresignedUploadUrl(r2_path);

  return {
    uploadUrl,
    r2_path,
  };
});
