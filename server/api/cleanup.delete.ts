import { useDB } from "~~/server/db/client";
import { deleteR2Object } from "~/utils/r2";
import { requireAuth } from "~~/server/utils/requireAuth";
import { getOrphanedFiles } from "~~/server/utils/queries/orphaned";
import { logger } from "~/utils/logger";
import type { CleanupResponse } from "~~/types/api";

export default defineEventHandler(async (event): Promise<CleanupResponse> => {
  await requireAuth(event);

  const db = useDB(event);
  const orphaned = await getOrphanedFiles(db);

  const deleted: string[] = [];
  const errors: Array<{ key: string; error: any }> = [];

  for (const file of orphaned) {
    try {
      await deleteR2Object(file.key);
      deleted.push(file.key);
    } catch (error) {
      logger.error(`Failed to delete R2 file: ${file.key}`, { error });
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
