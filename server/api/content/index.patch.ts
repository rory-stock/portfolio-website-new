import { eq, and } from "drizzle-orm";
import { content } from "~~/server/db/schema";
import { useDB } from "~~/server/db/client";

const ALLOWED_TABLES = ["info", "journal", "overview"] as const;

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const { table, updates } = await readBody(event);

  if (!table || !ALLOWED_TABLES.includes(table as any)) {
    throw createError({ statusCode: 400, message: "Invalid table" });
  }

  if (!Array.isArray(updates) || updates.length === 0) {
    throw createError({ statusCode: 400, message: "Updates array required" });
  }

  const db = useDB(event);

  // Upsert: update if exists, insert if not
  await Promise.all(
    updates.map(async ({ key, value }) => {
      const existing = await db
        .select()
        .from(content)
        .where(and(eq(content.key, key), eq(content.table, table)))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(content)
          .set({ value, updatedAt: new Date() })
          .where(and(eq(content.key, key), eq(content.table, table)));
      } else {
        // Insert new
        await db.insert(content).values({
          table,
          key,
          value,
          updatedAt: new Date(),
        });
      }
    })
  );

  return { success: true };
});
