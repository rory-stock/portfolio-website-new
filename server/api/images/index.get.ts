import { eq, and, desc, asc, count } from "drizzle-orm";

import { images } from "~~/server/db/schema";
import { useDB } from "~~/server/db/client";
import type { ImageListResponse } from "~~/types/api";
import { toImageBaseArray } from "~~/server/utils/imageTransform";

export default defineEventHandler(async (event): Promise<ImageListResponse> => {
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
  const includeLayouts = query.include_layouts === "true"; // opt-in for layout sorting

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

  // Choose sorting strategy based on includeLayouts flag
  const orderBy = includeLayouts
    ? [
        asc(images.group_display_order), // Groups first
        asc(images.order), // Then individual order
        desc(images.uploaded_at), // Then upload date
      ]
    : [
        asc(images.order), // Individual order
        desc(images.uploaded_at), // Then upload date
      ];

  // Query with conditions
  const [imageResults, [countResult]] = await Promise.all([
    db
      .select()
      .from(images)
      .where(whereClause)
      .orderBy(...orderBy),
    db.select({ count: count() }).from(images).where(whereClause),
  ]);

  return {
    images: toImageBaseArray(imageResults),
    total: countResult.count,
  };
});
