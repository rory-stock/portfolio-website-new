import { eq } from "drizzle-orm";

import { useDB } from "~~/server/db/client";
import { images } from "~~/server/db/schema";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const idParam = getRouterParam(event, "id");
  const id = parseInt(idParam || "");

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid image ID" });
  }

  const db = useDB(event);

  // Find the image record
  const imageRecord = await db
    .select()
    .from(images)
    .where(eq(images.id, id))
    .limit(1);

  if (imageRecord.length === 0) {
    throw createError({ statusCode: 404, message: "Image not found" });
  }

  const r2_path = imageRecord[0].r2_path;

  // Find all records with the same r2_path
  const relatedRecords = await db
    .select()
    .from(images)
    .where(eq(images.r2_path, r2_path));

  // Delete the requested DB record
  await db.delete(images).where(eq(images.id, id));

  // If this was the last/only context, delete from R2
  if (relatedRecords.length === 1) {
    try {
      const { IMAGES } = event.context.cloudflare.env;
      await IMAGES.delete(r2_path);
    } catch (error) {
      console.error("R2 Delete Error:", error);
      // Don't throw - DB record is already deleted
    }
  }

  return { success: true, id };
});
