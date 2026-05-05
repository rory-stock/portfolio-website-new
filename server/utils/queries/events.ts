import type { DrizzleD1Database } from "drizzle-orm/d1";
import { asc, desc, eq, isNull } from "drizzle-orm";
import * as schema from "~~/server/db/schema";
import {
  getFolderImages,
  getFolderWithCover,
} from "~~/server/utils/queries/folders";

/**
 * Get event by ID with optional images (via linked folder)
 */
export async function getEventById(
  db: DrizzleD1Database<typeof schema>,
  eventId: number,
  includeImages: boolean = false
) {
  const [event] = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.id, eventId));

  if (!event) {
    return null;
  }

  if (!includeImages || !event.folderId) {
    return { event, images: [] };
  }

  // Get images from the event's linked folder
  const result = await getFolderImages(db, event.folderId, {
    page: 1,
    limit: 500,
  });

  return {
    event,
    images: result.images,
  };
}

/**
 * Get event by slug with optional images
 */
export async function getEventBySlug(
  db: DrizzleD1Database<typeof schema>,
  slug: string,
  includeImages: boolean = false
) {
  const [event] = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.slug, slug));

  if (!event) {
    return null;
  }

  return getEventById(db, event.id, includeImages);
}

/**
 * Get all top-level events (no parent) with optional images
 * Sorted by: start_date DESC → created_at DESC → name ASC
 */
export async function getAllEvents(
  db: DrizzleD1Database<typeof schema>,
  options: {
    includeImages?: boolean;
  } = {}
) {
  const events = await db
    .select()
    .from(schema.events)
    .where(isNull(schema.events.parentEventId))
    .orderBy(
      desc(schema.events.startDate),
      desc(schema.events.createdAt),
      asc(schema.events.name)
    );

  if (!options.includeImages) {
    return events.map((event) => ({ event, images: [] }));
  }

  const results = await Promise.all(
    events.map(async (event) => {
      return await getEventById(db, event.id, true);
    })
  );

  return results.filter((r) => r !== null);
}

/**
 * Get sub-events for a parent event
 * Sorted by: start_date ASC → created_at ASC → name ASC
 */
export async function getSubEvents(
  db: DrizzleD1Database<typeof schema>,
  parentEventId: number,
  options: {
    includeImages?: boolean;
  } = {}
) {
  const events = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.parentEventId, parentEventId))
    .orderBy(
      asc(schema.events.startDate),
      asc(schema.events.createdAt),
      asc(schema.events.name)
    );

  if (!options.includeImages) {
    return events.map((event) => ({ event, images: [] }));
  }

  const results = await Promise.all(
    events.map(async (event) => {
      return await getEventById(db, event.id, true);
    })
  );

  return results.filter((r) => r !== null);
}

/**
 * Count sub-events for a parent event
 */
export async function getSubEventCount(
  db: DrizzleD1Database<typeof schema>,
  parentEventId: number
): Promise<number> {
  const subEvents = await db
    .select({ id: schema.events.id })
    .from(schema.events)
    .where(eq(schema.events.parentEventId, parentEventId));

  return subEvents.length;
}

/**
 * Get the cover image for an event via its linked folder's coverImageId.
 * Falls back to the first image in the folder if no cover is set.
 */
export async function getEventCoverImage(
  db: DrizzleD1Database<typeof schema>,
  eventId: number
) {
  // Get the event's folder ID
  const [event] = await db
    .select({ folderId: schema.events.folderId })
    .from(schema.events)
    .where(eq(schema.events.id, eventId));

  if (!event?.folderId) return null;

  // Use the existing folder cover resolution (includes fallback to first image)
  const folderData = await getFolderWithCover(db, event.folderId);

  if (!folderData?.coverImage) return null;

  return {
    base: folderData.coverImage.base,
    instance: folderData.coverImage.instance,
    metadata: null,
    layout: null,
  };
}

/**
 * Get the folder linked to an event
 */
export async function getEventFolder(
  db: DrizzleD1Database<typeof schema>,
  eventId: number
) {
  const [event] = await db
    .select({ folderId: schema.events.folderId })
    .from(schema.events)
    .where(eq(schema.events.id, eventId));

  if (!event?.folderId) return null;

  const [folder] = await db
    .select()
    .from(schema.imageFolders)
    .where(eq(schema.imageFolders.id, event.folderId));

  return folder || null;
}
