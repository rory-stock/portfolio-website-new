import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import type { EventUpdateRequest, EventResponse } from "~~/types/api";
import { updateEvent } from "~~/server/utils/mutations";
import { validateDate } from "~~/server/utils/validation";
import { eventToResponse } from "~~/server/utils/eventTransform";

export default defineEventHandler(async (event): Promise<EventResponse> => {
  await requireAuth(event);

  const db = useDB(event);
  const id = Number(getRouterParam(event, "id"));
  const body = await readBody<EventUpdateRequest>(event);

  if (!id || isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: "Invalid event ID",
    });
  }

  // Validate dates if provided
  if (body.start_date && !validateDate(body.start_date)) {
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

  // Transform API format to database format
  const updateData: any = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.start_date !== undefined) updateData.startDate = body.start_date;
  if (body.end_date !== undefined) updateData.endDate = body.end_date;
  if (body.location !== undefined) updateData.location = body.location;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.external_url !== undefined)
    updateData.externalUrl = body.external_url;

  const updatedEvent = await updateEvent(db, id, updateData);

  return eventToResponse(updatedEvent);
});
