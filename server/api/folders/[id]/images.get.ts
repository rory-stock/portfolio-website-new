import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import { getFolderById } from "~~/server/utils/queries/folders";
import { getFolderImages } from "~~/server/utils/queries/folders";
import { imageWithInstanceToDisplay } from "~~/server/utils/imageTransform";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const db = useDB(event);
  const id = Number(getRouterParam(event, "id"));
  const query = getQuery(event);

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid folder ID" });
  }

  // Verify folder exists
  const folder = await getFolderById(db, id);
  if (!folder) {
    throw createError({ statusCode: 404, message: "Folder not found" });
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));

  const result = await getFolderImages(db, id, { page, limit });

  const displayImages = result.images.map((imgData) =>
    imageWithInstanceToDisplay(imgData)
  );

  return {
    images: displayImages,
    total: result.total,
    page: result.page,
    limit: result.limit,
  };
});
