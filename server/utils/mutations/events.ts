import type { DrizzleD1Database } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "~~/server/db/schema";
import { generateSlug } from "../validation";
import type { NewEvent, NewEventImage } from "~~/types/database";

/**
 * Create an event record
 */
export async function createEvent(
  db: DrizzleD1Database<typeof schema>,
  data: {
    name: string;
    startDate: string;
    endDate?: string;
    location: string;
    description?: string;
    externalUrl?: string;
  }
) {
  const slug = generateSlug(data.name);

  const insertData: NewEvent = {
    name: data.name,
    slug,
    startDate: data.startDate,
    endDate: data.endDate || null,
    location: data.location,
    description: data.description || null,
    externalUrl: data.externalUrl || null,
    createdAt: new Date(),
    updatedAt: new Date(),
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
  const updateData: any = {
    ...data,
    updatedAt: new Date(),
  };

  // Regenerate slug if name changed
  if (data.name) {
    updateData.slug = generateSlug(data.name);
  }

  const [event] = await db
    .update(schema.events)
    .set(updateData)
    .where(eq(schema.events.id, id))
    .returning();

  return event;
}

/**
 * Delete an event (cascades to event_images)
 */
export async function deleteEvent(
  db: DrizzleD1Database<typeof schema>,
  id: number
) {
  await db.delete(schema.events).where(eq(schema.events.id, id));

  return { success: true };
}

/**
 * Add an image to an event
 */
export async function addImageToEvent(
  db: DrizzleD1Database<typeof schema>,
  eventId: number,
  imageInstanceId: number,
  isCover: boolean = false
) {
  // If setting as cover, unset other covers for this event
  if (isCover) {
    await db
      .update(schema.eventImages)
      .set({ isCover: false })
      .where(eq(schema.eventImages.eventId, eventId));
  }

  const insertData: NewEventImage = {
    eventId,
    imageInstanceId,
    isCover,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [eventImage] = await db
    .insert(schema.eventImages)
    .values(insertData)
    .returning();

  return eventImage;
}
