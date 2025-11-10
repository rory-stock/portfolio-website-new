import { useDB } from "~~/server/db/client";
import { images } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const r2 = event.context.cloudflare?.env?.IMAGES;

  if (!r2) {
    throw createError({
      statusCode: 500,
      message: "R2 binding not found",
    });
  }

  const db = useDB(event);

  // Get orphaned files
  const dbImages = await db.select({ r2_path: images.r2_path }).from(images);

  const dbPaths = new Set(dbImages.map((img) => img.r2_path));

  const contexts = ["home", "journal", "info"];
  const deleted: string[] = [];

  for (const context of contexts) {
    const listed = await r2.list({ prefix: `${context}/` });

    for (const object of listed.objects) {
      if (!dbPaths.has(object.key)) {
        await r2.delete(object.key);
        deleted.push(object.key);
      }
    }
  }

  return {
    success: true,
    deleted,
    count: deleted.length,
  };
});
