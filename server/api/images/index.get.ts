import { eq, and, desc, sql, asc } from "drizzle-orm";

import { images } from "~~/server/db/schema";
import { useDB } from "~~/server/db/client";

export default defineEventHandler(async (event) => {
  const db = useDB(event);
  const query = getQuery(event);
  const session = await getUserSession(event);

  // Parse query params
  const context = query.context as string | undefined;
  const isPrimary =
    query.is_primary === "true"
      ? true
      : query.is_primary === "false"
        ? false
        : undefined;
  const r2Path = query.r2_path as string | undefined;

  // Build where conditions
  const conditions = [];
  if (!session?.user) {
    conditions.push(eq(images.is_public, true));
  }
  if (context) {
    conditions.push(eq(images.context, context));
  }
  if (isPrimary !== undefined) {
    conditions.push(eq(images.is_primary, isPrimary));
  }
  if (r2Path) {
    conditions.push(eq(images.r2_path, r2Path));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Query with conditions
  const [imageResults, countResult] = await Promise.all([
    db
      .select()
      .from(images)
      .where(whereClause)
      .orderBy(asc(images.order), desc(images.uploaded_at)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(images)
      .where(whereClause),
  ]);

  return {
    images: imageResults,
    total: Number(countResult[0].count),
  };
});
