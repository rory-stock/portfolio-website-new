import { eq, and } from "drizzle-orm";
import { content } from "~~/server/db/schema";
import { useDB } from "~~/server/db/client";

const ALLOWED_TABLES = ["info", "journal", "overview"] as const;

export default defineEventHandler(async (event) => {
  const { loggedIn } = await getUserSession(event);
  if (!loggedIn) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const { table, id, value } = await readBody(event);

  if (!table || !ALLOWED_TABLES.includes(table as any)) {
    throw createError({ statusCode: 400, message: "Invalid table" });
  }

  const db = useDB(event);
  await db
    .update(content)
    .set({ value, updatedAt: new Date() })
    .where(and(eq(content.id, id), eq(content.table, table)));

  return { success: true };
});
