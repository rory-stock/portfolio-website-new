import { z } from "zod";
import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import type { EventResponse } from "~~/types/api";
import { createEventRecord } from "~~/server/utils/mutations";
import { eventToResponse } from "~~/server/utils/eventTransform";
import { eq } from "drizzle-orm";
import * as schema from "~~/server/db/schema";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const bodySchema = z
  .object({
    name: z.string().min(1, "Name is required").trim(),
    start_date: z
      .string()
      .regex(DATE_REGEX, "start_date must be in YYYY-MM-DD format"),
    end_date: z
      .string()
      .regex(DATE_REGEX, "end_date must be in YYYY-MM-DD format")
      .optional(),
    location: z.string().trim().optional().default(""),
    description: z.string().trim().optional(),
    external_url: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || val === "" || /^https?:\/\/.+/.test(val),
        "external_url must be a valid URL"
      ),
    parent_event_id: z.number().int().positive().optional(),
  })
  .refine(
    (data) => {
      // Location is required for top-level events
      return !(!data.parent_event_id && !data.location);

    },
    {
      message: "Location is required for top-level events",
      path: ["location"],
    }
  );

export default defineEventHandler(async (event): Promise<EventResponse> => {
  await requireAuth(event);

  const db = useDB(event);
  const body = await readValidatedBody(event, bodySchema.parse);

  // Validate parent event exists if specified
  if (body.parent_event_id) {
    const [parent] = await db
      .select({ id: schema.events.id })
      .from(schema.events)
      .where(eq(schema.events.id, body.parent_event_id));

    if (!parent) {
      throw createError({
        statusCode: 400,
        message: "Parent event not found",
      });
    }
  }

  const newEvent = await createEventRecord(db, {
    name: body.name,
    startDate: body.start_date,
    endDate: body.end_date,
    location: body.location,
    description: body.description,
    externalUrl: body.external_url || undefined,
    parentEventId: body.parent_event_id ?? null,
  });

  if (!newEvent) {
    throw createError({
      statusCode: 500,
      message: "Failed to create event",
    });
  }

  return eventToResponse(newEvent);
});
