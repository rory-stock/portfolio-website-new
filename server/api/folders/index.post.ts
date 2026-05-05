import { eq, and, isNull } from "drizzle-orm";
import { useDB } from "~~/server/db/client";
import * as schema from "~~/server/db/schema";
import { requireAuth } from "~~/server/utils/requireAuth";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const db = useDB(event);
  const body = await readBody<{
    name: string;
    slug: string;
    parent_folder_id?: number | null;
    folder_type: "event" | "client_gallery" | "project";
    is_public?: boolean;
  }>(event);

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, message: "Name is required" });
  }

  if (!body.slug?.trim()) {
    throw createError({ statusCode: 400, message: "Slug is required" });
  }

  if (!body.folder_type) {
    throw createError({ statusCode: 400, message: "Folder type is required" });
  }

  // Check for duplicate slug under the same parent
  const parentId = body.parent_folder_id ?? null;

  const existingConditions = parentId
    ? and(
        eq(schema.imageFolders.slug, body.slug.trim()),
        eq(schema.imageFolders.parentFolderId, parentId)
      )
    : and(
        eq(schema.imageFolders.slug, body.slug.trim()),
        isNull(schema.imageFolders.parentFolderId)
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

  // Validate parent folder exists if specified
  if (parentId) {
    const [parent] = await db
      .select({ id: schema.imageFolders.id })
      .from(schema.imageFolders)
      .where(eq(schema.imageFolders.id, parentId));

    if (!parent) {
      throw createError({
        statusCode: 400,
        message: "Parent folder not found",
      });
    }
  }

  const now = new Date();
  const [folder] = await db
    .insert(schema.imageFolders)
    .values({
      name: body.name.trim(),
      slug: body.slug.trim(),
      parentFolderId: parentId,
      folderType: body.folder_type,
      isPublic: body.is_public ?? false,
      imageCount: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (!folder) {
    throw createError({
      statusCode: 500,
      message: "Failed to create folder",
    });
  }

  return {
    folder: {
      id: folder.id,
      name: folder.name,
      slug: folder.slug,
      parent_folder_id: folder.parentFolderId,
      folder_type: folder.folderType,
      is_public: folder.isPublic,
      image_count: folder.imageCount,
      created_at: folder.createdAt,
      updated_at: folder.updatedAt,
    },
  };
});
