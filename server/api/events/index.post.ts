import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import type { EventCreateRequest, EventResponse } from "~~/types/api";
import { createEventRecord } from "~~/server/utils/mutations";
import { validateDate } from "~~/server/utils/validation";
import { eventToResponse } from "~~/server/utils/eventTransform";

export default defineEventHandler(async (event): Promise<EventResponse> => {
  await requireAuth(event);

  const db = useDB(event);
  const body = await readBody<
    EventCreateRequest & { parent_event_id?: number }
  >(event);

  const isSubEvent = !!body.parent_event_id;

  // Validation
  if (!body.name || !body.start_date) {
    throw createError({
      statusCode: 400,
      message: "name and start_date are required",
    });
  }

  if (!isSubEvent && !body.location) {
    throw createError({
      statusCode: 400,
      message: "name, start_date, and location are required",
    });
  }

  if (!validateDate(body.start_date)) {
    throw createError({
      statusCode: 400,
      message: "start_date must be in YYYY-MM-DD format",
    });
  }

  if (body.end_date && !validateDate(body.end_date)) {
    throw createError({
      statusCode: 400,
      message: "end_date must be in YYYY-MM-DD format",
    });
  }

  // If parent_event_id provided, validate it exists
  if (body.parent_event_id) {
    const { eq } = await import("drizzle-orm");
    const schema = await import("~~/server/db/schema");

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
    location: body.location || "",
    description: body.description,
    externalUrl: body.external_url,
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
