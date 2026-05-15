import { eq, desc } from "drizzle-orm";
import * as schema from "~~/server/db/schema";
import { resolveFolder } from "~~/server/utils/resolveFolder";

export default defineEventHandler(async (event) => {
  const { db, folder } = await resolveFolder(event);

  const emails = await db
    .select()
    .from(schema.folderAccessEmails)
    .where(eq(schema.folderAccessEmails.folderId, folder.id))
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
