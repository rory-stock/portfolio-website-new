import { eq, desc } from "drizzle-orm";
import { useDB } from "~~/server/db/client";
import * as schema from "~~/server/db/schema";
import { requireAuth } from "~~/server/utils/requireAuth";
import { getFolderById } from "~~/server/utils/queries/folders";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const db = useDB(event);
  const id = Number(getRouterParam(event, "id"));

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid folder ID" });
  }

  const folder = await getFolderById(db, id);
  if (!folder) {
    throw createError({ statusCode: 404, message: "Folder not found" });
  }

  const emails = await db
    .select()
    .from(schema.folderAccessEmails)
    .where(eq(schema.folderAccessEmails.folderId, id))
    .orderBy(desc(schema.folderAccessEmails.accessedAt));

  return {
    emails: emails.map((e) => ({
      id: e.id,
      email: e.email,
      accessed_at: e.accessedAt,
      created_at: e.createdAt,
    })),
    total: emails.length,
  };
});
