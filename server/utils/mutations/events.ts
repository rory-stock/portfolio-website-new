import type { DrizzleD1Database } from "drizzle-orm/d1";
import { eq, and, isNull } from "drizzle-orm";
import * as schema from "~~/server/db/schema";
import type { NewEvent } from "~~/types/database";
import { generateUniqueSlug } from "~/utils/slug";

/**
 * Create an event record with optional parent event and auto-folder creation
 */
export async function createEventRecord(
  db: DrizzleD1Database<typeof schema>,
  data: {
    name: string;
    startDate: string;
    endDate?: string;
    location: string;
    description?: string;
    externalUrl?: string;
    parentEventId?: number | null;
  }
) {
  // Generate slug scoped to siblings under the same parent
  const parentId = data.parentEventId ?? null;

  const siblingCondition = parentId
    ? eq(schema.events.parentEventId, parentId)
    : isNull(schema.events.parentEventId);

  const siblings = await db
    .select({ slug: schema.events.slug })
    .from(schema.events)
    .where(siblingCondition);

  const existingSlugs = siblings.map((s) => s.slug);
  const slug = generateUniqueSlug(data.name, existingSlugs);

  // Auto-create a linked folder for this event
  const parentEvent = parentId
    ? await db
        .select({ folderId: schema.events.folderId })
        .from(schema.events)
        .where(eq(schema.events.id, parentId))
        .then(([e]) => e)
    : null;

  const parentFolderId = parentEvent?.folderId ?? null;

  const folderSiblingCondition = parentFolderId
    ? eq(schema.imageFolders.parentFolderId, parentFolderId)
    : isNull(schema.imageFolders.parentFolderId);

  const folderSiblings = await db
    .select({ slug: schema.imageFolders.slug })
    .from(schema.imageFolders)
    .where(
      and(folderSiblingCondition, eq(schema.imageFolders.folderType, "event"))
    );

  const existingFolderSlugs = folderSiblings.map((s) => s.slug);
  const folderSlug = generateUniqueSlug(data.name, existingFolderSlugs);

  const now = new Date();

  // Create the folder
  const [folder] = await db
    .insert(schema.imageFolders)
    .values({
      name: data.name,
      slug: folderSlug,
      parentFolderId: parentFolderId,
      folderType: "event",
      isPublic: false,
      imageCount: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (!folder) {
    throw createError({
      statusCode: 500,
      message: "Failed to create folder for event",
    });
  }

  // Create the event with a folder link
  const insertData: NewEvent = {
    name: data.name,
    slug,
    parentEventId: parentId,
    folderId: folder.id,
    startDate: data.startDate,
    endDate: data.endDate || null,
    location: data.location,
    description: data.description || null,
    externalUrl: data.externalUrl || null,
    createdAt: now,
    updatedAt: now,
  };

  const [event] = await db.insert(schema.events).values(insertData).returning();

  return event;
}

/**
 * Update an event record
 */
export async function updateEvent(
  db: DrizzleD1Database<typeof schema>,
  id: number,
  data: Partial<{
    name: string;
    startDate: string;
    endDate: string;
    location: string;
    description: string;
    externalUrl: string;
  }>
) {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.startDate !== undefined) updateData.startDate = data.startDate;
  if (data.endDate !== undefined) updateData.endDate = data.endDate;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.externalUrl !== undefined) updateData.externalUrl = data.externalUrl;

  // Regenerate slug if name changed — scoped to siblings under the same parent
  if (data.name) {
    // Get the current event to find its parent
    const [currentEvent] = await db
      .select({
        parentEventId: schema.events.parentEventId,
      })
      .from(schema.events)
      .where(eq(schema.events.id, id));

    const parentId = currentEvent?.parentEventId ?? null;

    const siblingCondition = parentId
      ? eq(schema.events.parentEventId, parentId)
      : isNull(schema.events.parentEventId);

    const siblings = await db
      .select({ slug: schema.events.slug, id: schema.events.id })
      .from(schema.events)
      .where(siblingCondition);

    const existingSlugs = siblings
      .filter((s) => s.id !== id)
      .map((s) => s.slug);

    updateData.slug = generateUniqueSlug(data.name, existingSlugs);
  }

  const [event] = await db
    .update(schema.events)
    .set(updateData)
    .where(eq(schema.events.id, id))
    .returning();

  return event;
}

/**
 * Delete an event and its linked folder.
 * Cascading: event deletion removes the event record,
 * folder deletion cascades to folder_images.
 */
export async function deleteEvent(
  db: DrizzleD1Database<typeof schema>,
  id: number
) {
  // Check for sub-events
  const subEvents = await db
    .select({ id: schema.events.id })
    .from(schema.events)
    .where(eq(schema.events.parentEventId, id))
    .limit(1);

  if (subEvents.length > 0) {
    throw createError({
      statusCode: 409,
      message: "Cannot delete event with sub-events. Delete sub-events first.",
    });
  }

  // Get the event to find its folder
  const [event] = await db
    .select({ folderId: schema.events.folderId })
    .from(schema.events)
    .where(eq(schema.events.id, id));

  // Delete the event
  await db.delete(schema.events).where(eq(schema.events.id, id));

  // Delete the linked folder if it exists (cascades to folder_images)
  if (event?.folderId) {
    await db
      .delete(schema.imageFolders)
      .where(eq(schema.imageFolders.id, event.folderId));
  }

  return { success: true };
}
