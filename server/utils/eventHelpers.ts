/**
 * Event helper functions
 * Utilities for querying and manipulating events and subpages
 */

import type { DrizzleD1Database } from "drizzle-orm/d1";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { events_metadata, events_subpages, images_events_metadata, } from "~~/server/db/schema";
import type * as schema from "../db/schema";
import type { EventSubpage, EventSubpageWithCount, EventWithDetails, EventWithSubpages, } from "~~/types/eventTypes";

/**
 * Generate URL-safe slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with a single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Validate event date format (YYYY-MM-DD)
 */
export function isValidEventDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate subpage date is >= parent event date
 */
export function isSubpageDateValid(
  subpageDate: string,
  eventDate: string
): boolean {
  if (!isValidEventDate(subpageDate) || !isValidEventDate(eventDate)) {
    return false;
  }
  return new Date(subpageDate) >= new Date(eventDate);
}

/**
 * Get all events with image counts
 * Sorted by: event_date DESC, name ASC, created_at DESC
 */
export async function getAllEvents(
  db: DrizzleD1Database<typeof schema>,
  includePrivate = false
): Promise<EventWithSubpages[]> {
  // Base query
  let query = db.select().from(events_metadata);

  // Filter by public status if needed
  if (!includePrivate) {
    query = query.where(eq(events_metadata.is_public, true)) as any;
  }

  // Get events with sorting
  const events = await query
    .orderBy(
      desc(events_metadata.event_date),
      asc(events_metadata.event_name),
      desc(events_metadata.created_at)
    )
    .all();

  // Get image counts for each event
  return await Promise.all(
    events.map(async (event) => {
      // Count total images for this event
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(images_events_metadata)
        .where(eq(images_events_metadata.event_id, event.id));

      // Get subpages
      const subpages = await getEventSubpages(db, event.id);

      return {
        ...event,
        subpages,
        image_count: countResult?.count ?? 0,
      };
    })
  );
}

/**
 * Get event by slug with subpages
 */
export async function getEventBySlug(
  db: DrizzleD1Database<typeof schema>,
  slug: string,
  includePrivate = false
): Promise<EventWithSubpages | null> {
  const conditions = [eq(events_metadata.event_slug, slug)];

  if (!includePrivate) {
    conditions.push(eq(events_metadata.is_public, true));
  }

  const [event] = await db
    .select()
    .from(events_metadata)
    .where(and(...conditions))
    .limit(1);

  if (!event) return null;

  // Get subpages
  const subpages = await getEventSubpages(db, event.id);

  // Get total image count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(images_events_metadata)
    .where(eq(images_events_metadata.event_id, event.id));

  return {
    ...event,
    subpages,
    image_count: countResult?.count ?? 0,
  };
}

/**
 * Get event by ID with full details
 */
export async function getEventById(
  db: DrizzleD1Database<typeof schema>,
  id: number
): Promise<EventWithDetails | null> {
  const [event] = await db
    .select()
    .from(events_metadata)
    .where(eq(events_metadata.id, id))
    .limit(1);

  if (!event) return null;

  // Get subpages with image counts
  const subpages = await getEventSubpagesWithCounts(db, event.id);

  // Get the main gallery count (images not in any subpage)
  const [mainGalleryCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(images_events_metadata)
    .where(
      and(
        eq(images_events_metadata.event_id, event.id),
        isNull(images_events_metadata.event_subpage_id)
      )
    );

  // Get total image count
  const [totalCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(images_events_metadata)
    .where(eq(images_events_metadata.event_id, event.id));

  return {
    ...event,
    subpages,
    main_gallery_count: mainGalleryCount?.count ?? 0,
    total_image_count: totalCount?.count ?? 0,
  };
}

/**
 * Get all subpages for an event
 * Sorted by: subpage_date DESC, name ASC, created_at DESC
 */
export async function getEventSubpages(
  db: DrizzleD1Database<typeof schema>,
  eventId: number
): Promise<EventSubpage[]> {
  return db
    .select()
    .from(events_subpages)
    .where(eq(events_subpages.event_id, eventId))
    .orderBy(
      desc(events_subpages.subpage_date),
      asc(events_subpages.subpage_name),
      desc(events_subpages.created_at)
    )
    .all();
}

/**
 * Get subpages with image counts
 */
export async function getEventSubpagesWithCounts(
  db: DrizzleD1Database<typeof schema>,
  eventId: number
): Promise<EventSubpageWithCount[]> {
  const subpages = await getEventSubpages(db, eventId);

  // Get image counts for each subpage
  return await Promise.all(
    subpages.map(async (subpage) => {
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(images_events_metadata)
        .where(eq(images_events_metadata.event_subpage_id, subpage.id));

      return {
        ...subpage,
        image_count: countResult?.count ?? 0,
      };
    })
  );
}

/**
 * Get subpage by slug within an event
 */
export async function getSubpageBySlug(
  db: DrizzleD1Database<typeof schema>,
  eventId: number,
  subpageSlug: string
): Promise<EventSubpage | null> {
  const [subpage] = await db
    .select()
    .from(events_subpages)
    .where(
      and(
        eq(events_subpages.event_id, eventId),
        eq(events_subpages.subpage_slug, subpageSlug)
      )
    )
    .limit(1);

  return subpage || null;
}

/**
 * Check if event slug is unique
 */
export async function isEventSlugUnique(
  db: DrizzleD1Database<typeof schema>,
  slug: string,
  excludeId?: number
): Promise<boolean> {
  let query = db
    .select({ id: events_metadata.id })
    .from(events_metadata)
    .where(eq(events_metadata.event_slug, slug));

  if (excludeId) {
    query = query.where(sql`${events_metadata.id} != ${excludeId}`) as any;
  }

  const [existing] = await query.limit(1);
  return !existing;
}

/**
 * Check if a subpage slug is unique within an event
 */
export async function isSubpageSlugUnique(
  db: DrizzleD1Database<typeof schema>,
  eventId: number,
  slug: string,
  excludeId?: number
): Promise<boolean> {
  let conditions = [
    eq(events_subpages.event_id, eventId),
    eq(events_subpages.subpage_slug, slug),
  ];

  if (excludeId) {
    conditions.push(sql`${events_subpages.id} != ${excludeId}`);
  }

  const [existing] = await db
    .select({ id: events_subpages.id })
    .from(events_subpages)
    .where(and(...conditions))
    .limit(1);

  return !existing;
}

/**
 * Check if the event has any subpages
 */
export async function eventHasSubpages(
  db: DrizzleD1Database<typeof schema>,
  eventId: number
): Promise<boolean> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(events_subpages)
    .where(eq(events_subpages.event_id, eventId));

  return (result?.count ?? 0) > 0;
}
