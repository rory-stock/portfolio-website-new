import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import { getOrphanedFiles } from "~~/server/utils/queries/orphaned";
import type { OrphanedFilesResponse } from "~~/types/api";

export default defineEventHandler(
  async (event): Promise<OrphanedFilesResponse> => {
    await requireAuth(event);

    const db = useDB(event);
    const orphaned = await getOrphanedFiles(db);

    return {
      orphaned: orphaned.map((file) => ({
        key: file.key,
        size: file.size,
        lastModified: file.lastModified.toISOString(),
      })),
      total: orphaned.length,
    };
  }
);
