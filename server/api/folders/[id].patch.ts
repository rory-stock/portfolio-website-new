import { eq, and, isNull, ne } from "drizzle-orm";
import { useDB } from "~~/server/db/client";
import * as schema from "~~/server/db/schema";
import { requireAuth } from "~~/server/utils/requireAuth";
import { getFolderById } from "~~/server/utils/queries/folders";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const db = useDB(event);
  const id = Number(getRouterParam(event, "id"));
  const body = await readBody<{
    name?: string;
    slug?: string;
    is_public?: boolean;
  }>(event);

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid folder ID" });
  }

  const folder = await getFolderById(db, id);
  if (!folder) {
    throw createError({ statusCode: 404, message: "Folder not found" });
  }

  // If the slug is changing, check for duplicates under the same parent
  if (body.slug && body.slug.trim() !== folder.slug) {
    const parentId = folder.parentFolderId;

    const existingConditions = parentId
      ? and(
          eq(schema.imageFolders.slug, body.slug.trim()),
          eq(schema.imageFolders.parentFolderId, parentId),
          ne(schema.imageFolders.id, id)
        )
      : and(
          eq(schema.imageFolders.slug, body.slug.trim()),
          isNull(schema.imageFolders.parentFolderId),
          ne(schema.imageFolders.id, id)
        );

    const [existing] = await db
      .select({ id: schema.imageFolders.id })
      .from(schema.imageFolders)
      .where(existingConditions)
      .limit(1);

    if (existing) {
      throw createError({
        statusCode: 409,
        message: "A folder with this slug already exists at this level",
      });
    }
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.slug !== undefined) updates.slug = body.slug.trim();
  if (body.is_public !== undefined) updates.isPublic = body.is_public;

  const [updated] = await db
    .update(schema.imageFolders)
    .set(updates)
    .where(eq(schema.imageFolders.id, id))
    .returning();

  return {
    folder: {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      parent_folder_id: updated.parentFolderId,
      folder_type: updated.folderType,
      is_public: updated.isPublic,
      image_count: updated.imageCount,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
    },
  };
});
