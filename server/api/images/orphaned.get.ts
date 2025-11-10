import { images } from "~~/server/db/schema";
import { useDB } from "~~/server/db/client";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const db = useDB(event);
  const r2 = event.context.cloudflare?.env?.IMAGES;

  if (!r2) {
    throw createError({
      statusCode: 500,
      message: "R2 binding not found",
    });
  }

  // Get all r2_paths from DB
  const dbImages = await db.select({ r2_path: images.r2_path }).from(images);

  const dbPaths = new Set(dbImages.map((img) => img.r2_path));

  // List all R2 objects
  const contexts = ["home", "journal", "info"];
  const orphaned: string[] = [];

  for (const context of contexts) {
    const listed = await r2.list({ prefix: `${context}/` });

    for (const object of listed.objects) {
      if (!dbPaths.has(object.key)) {
        orphaned.push(object.key);
      }
    }
  }

  return {
    orphaned,
    count: orphaned.length,
  };
});
