import { eq, and } from "drizzle-orm";
import { content } from "~~/server/db/schema";
import { useDB } from "~~/server/db/client";

const ALLOWED_TABLES = ["info", "journal", "overview"] as const;

export default defineEventHandler(async (event) => {
  const { table } = getQuery(event);

  if (!table || !ALLOWED_TABLES.includes(table as any)) {
    throw createError({ statusCode: 400, message: "Invalid table" });
  }

  const db = useDB(event);
  const rows = await db
    .select()
    .from(content)
    .where(eq(content.tableName, table as string));

  return rows;
});
