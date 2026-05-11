import { eq } from "drizzle-orm";
import { useDB } from "~~/server/db/client";
import * as schema from "~~/server/db/schema";
import { isDownloadableContext } from "~/utils/constants";
import { cleanDownloadFilename } from "~/utils/format";
import { getR2Object } from "~/utils/r2";
import { validateImageAccess } from "~~/server/utils/folderAccess";

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid image ID" });
  }

  const db = useDB(event);

  // Get the image instance
  const [instance] = await db
    .select()
    .from(schema.imageInstances)
    .where(eq(schema.imageInstances.id, id));

  if (!instance) {
    throw createError({ statusCode: 404, message: "Image not found" });
  }

  // Validate context allows downloads
  if (!isDownloadableContext(instance.context)) {
    throw createError({
      statusCode: 403,
      message: "Downloads are not available for this content",
    });
  }

  // Validate folder access control
  const hasAccess = await validateImageAccess(event, db, id);

  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      message: "Access denied — this content is protected",
    });
  }

  // Get the base image for R2 path and filename
  const [baseImage] = await db
    .select()
    .from(schema.baseImages)
    .where(eq(schema.baseImages.id, instance.imageId));

  if (!baseImage) {
    throw createError({ statusCode: 404, message: "Image data not found" });
  }

  // Fetch full-res file from R2
  let fileStream;
  try {
    fileStream = await getR2Object(baseImage.r2Path);
  } catch (error) {
    throw createError({
      statusCode: 502,
      message: "Failed to retrieve image file",
    });
  }

  if (!fileStream) {
    throw createError({
      statusCode: 404,
      message: "Image file not found in storage",
    });
  }

  // Clean the filename for the download
  const cleanFilename = cleanDownloadFilename(baseImage.originalFilename);

  // Determine content type from the R2 path extension
  const ext = baseImage.r2Path.split(".").pop()?.toLowerCase();
  const contentTypeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    png: "image/png",
  };
  const contentType = contentTypeMap[ext || ""] || "application/octet-stream";

  // Check if this is an inline view request (iOS mobile flow)
  const query = getQuery(event);
  const isViewMode = query.view === "true";

  // Set response headers
  setResponseHeader(event, "Content-Type", contentType);
  setResponseHeader(
    event,
    "Content-Disposition",
    isViewMode
      ? `inline; filename="${cleanFilename}"`
      : `attachment; filename="${cleanFilename}"`
  );
  setResponseHeader(event, "Content-Length", baseImage.fileSize);
  setResponseHeader(event, "Cache-Control", "private, no-cache");

  return fileStream;
});
