import { useDB } from "~~/server/db/client";
import { images } from "~~/server/db/schema";
import { listR2Objects } from "~~/server/utils/r2";

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

  // Find R2 files that don't exist in DB
  const orphaned = r2Files.filter((file) => !dbPaths.has(file.key));

  return {
    orphaned: orphaned.map((file) => ({
      key: file.key,
      size: file.size,
      lastModified: file.lastModified,
    })),
    total: orphaned.length,
  };
});
