import { z } from "zod";
import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import { createGalleryRecord } from "~~/server/utils/mutations/galleries";
import { galleryToResponse } from "~~/server/utils/galleryTransform";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const bodySchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  client_name: z.string().trim().optional(),
  shoot_date: z
    .string()
    .regex(DATE_REGEX, "shoot_date must be in YYYY-MM-DD format")
    .optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const db = useDB(event);
  const body = await readValidatedBody(event, bodySchema.parse);

  const gallery = await createGalleryRecord(db, {
    name: body.name,
    clientName: body.client_name,
    shootDate: body.shoot_date,
  });

  if (!gallery) {
    throw createError({
      statusCode: 500,
      message: "Failed to create gallery",
    });
  }

  return galleryToResponse(gallery);
});
