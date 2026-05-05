import { z } from "zod";
import { useDB } from "#server/db/client";
import { requireAuth } from "#server/utils/requireAuth";
import type { EventResponse } from "~~/types/api";
import { updateEvent } from "#server/utils/mutations";
import { eventToResponse } from "#server/utils/eventTransform";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const bodySchema = z.object({
  name: z.string().min(1).trim().optional(),
  start_date: z
    .string()
    .regex(DATE_REGEX, "start_date must be in YYYY-MM-DD format")
    .optional(),
  end_date: z
    .string()
    .regex(DATE_REGEX, "end_date must be in YYYY-MM-DD format")
    .nullable()
    .optional(),
  location: z.string().trim().optional(),
  description: z.string().trim().nullable().optional(),
  external_url: z
    .string()
    .trim()
    .nullable()
    .optional()
    .refine(
      (val) =>
        val === undefined ||
        val === null ||
        val === "" ||
        /^https?:\/\/.+/.test(val),
      "external_url must be a valid URL"
    ),
});

export default defineEventHandler(async (event): Promise<EventResponse> => {
  await requireAuth(event);

  const db = useDB(event);
  const id = Number(getRouterParam(event, "id"));

  if (!id || isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: "Invalid event ID",
    });
  }

  const body = await readValidatedBody(event, bodySchema.parse);

  // Transform API format to database format
  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.start_date !== undefined) updateData.startDate = body.start_date;
  if (body.end_date !== undefined) updateData.endDate = body.end_date;
  if (body.location !== undefined) updateData.location = body.location;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.external_url !== undefined)
    updateData.externalUrl = body.external_url;

  const updatedEvent = await updateEvent(db, id, updateData);

  if (!updatedEvent) {
    throw createError({
      statusCode: 404,
      message: "Event not found",
    });
  }

  return eventToResponse(updatedEvent);
});
