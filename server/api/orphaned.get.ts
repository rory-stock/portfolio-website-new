import { useDB } from "~~/server/db/client";
import { images } from "~~/server/db/schema";
import { listR2Objects } from "~/utils/r2";
import { requireAuth } from "~~/server/utils/requireAuth";
import type { OrphanedFilesResponse } from "~~/types/api";

export default defineEventHandler(async (event): Promise<OrphanedFilesResponse> => {
  await requireAuth(event);

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
      lastModified: file.lastModified.toISOString(),
    })),
    total: orphaned.length,
  };
});
