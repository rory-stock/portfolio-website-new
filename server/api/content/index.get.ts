import { eq } from "drizzle-orm";
import { content } from "~~/server/db/schema";
import { useDB } from "~~/server/db/client";
import { isValidContext, VALID_CONTEXTS } from "~/utils/context";
import type { ContentItem } from "~~/types/api";

export default defineEventHandler(async (event): Promise<ContentItem[]> => {
  const { table } = getQuery(event);

  if (!table || !isValidContext(table)) {
    throw createError({
      statusCode: 400,
      message: `Invalid table. Must be one of: ${VALID_CONTEXTS.join(", ")}`
    });
  }

  const db = useDB(event);

  return db
    .select()
    .from(content)
    .where(eq(content.table, table as string));
});
