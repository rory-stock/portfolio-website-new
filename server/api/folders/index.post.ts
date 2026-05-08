import { z } from "zod";
import { eq, and, isNull } from "drizzle-orm";
import { useDB } from "~~/server/db/client";
import * as schema from "~~/server/db/schema";
import { requireAuth } from "~~/server/utils/requireAuth";

const bodySchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  slug: z.string().min(1, "Slug is required").trim(),
  parent_folder_id: z.number().int().positive().nullable().optional(),
  folder_type: z.enum(["event", "gallery", "project"], {
    error: "Folder type must be event, gallery, or project",
  }),
  is_public: z.boolean().optional().default(false),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const db = useDB(event);
  const body = await readValidatedBody(event, bodySchema.parse);

  const parentId = body.parent_folder_id ?? null;

  // Check for duplicate slug under the same parent
  const existingConditions = parentId
    ? and(
        eq(schema.imageFolders.slug, body.slug),
        eq(schema.imageFolders.parentFolderId, parentId)
      )
    : and(
        eq(schema.imageFolders.slug, body.slug),
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
      name: body.name,
      slug: body.slug,
      parentFolderId: parentId,
      folderType: body.folder_type,
      isPublic: body.is_public,
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
