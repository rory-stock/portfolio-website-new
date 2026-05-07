import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "~~/server/db/schema";
import { listR2Objects } from "~/utils/r2";

export interface OrphanedFile {
  key: string;
  size: number;
  lastModified: Date;
}

/**
 * Find R2 files that have no matching r2_path in base_images.
 */
export async function getOrphanedFiles(
  db: DrizzleD1Database<typeof schema>
): Promise<OrphanedFile[]> {
  const [r2Files, dbRecords] = await Promise.all([
    listR2Objects(),
    db
      .selectDistinct({ r2_path: schema.baseImages.r2Path })
      .from(schema.baseImages),
  ]);

  const dbPaths = new Set(dbRecords.map((r) => r.r2_path));

  return r2Files.filter((file) => !dbPaths.has(file.key));
}
