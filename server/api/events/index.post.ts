import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import type { EventCreateRequest, EventResponse } from "~~/types/api";
import { createEvent } from "~~/server/utils/mutations";
import { validateDate } from "~~/server/utils/validation";
import { eventToResponse } from "~~/server/utils/eventTransform";

export default defineEventHandler(async (event): Promise<EventResponse> => {
  await requireAuth(event);

  const db = useDB(event);
  const body = await readBody<EventCreateRequest>(event);

  // Validation
  if (!body.name || !body.start_date || !body.location) {
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

  const newEvent = await createEvent(db, {
    name: body.name,
    startDate: body.start_date,
    endDate: body.end_date,
    location: body.location,
    description: body.description,
    externalUrl: body.external_url,
  });

  return eventToResponse(newEvent);
});
