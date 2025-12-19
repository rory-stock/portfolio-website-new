import { useDB } from "~~/server/db/client";
import { images } from "~~/server/db/schema";
import { listR2Objects, deleteR2Object } from "~/utils/r2";

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const db = useDB(event);

  // Get all R2 files
  const r2Files = await listR2Objects();

  // Get all unique r2_paths from DB
  const dbRecords = await db
    .selectDistinct({ r2_path: images.r2_path })
    .from(images);

  const dbPaths = new Set(dbRecords.map((r) => r.r2_path));

  // Find and delete orphaned R2 files
  const orphaned = r2Files.filter((file) => !dbPaths.has(file.key));
  const deleted = [];
  const errors = [];

  for (const file of orphaned) {
    try {
      await deleteR2Object(file.key);
      deleted.push(file.key);
    } catch (error) {
      console.error(`Failed to delete ${file.key}:`, error);
      errors.push({ key: file.key, error });
    }
  }

  return {
    success: true,
    deleted: deleted.length,
    failed: errors.length,
    errors,
  };
});
