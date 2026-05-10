import { z } from "zod";
import { resolveGallery } from "~~/server/utils/resolveGallery";
import { updateGallery } from "~~/server/utils/mutations/galleries";
import { galleryToResponse } from "~~/server/utils/galleryTransform";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const bodySchema = z.object({
  name: z.string().min(1).trim().optional(),
  client_name: z.string().trim().nullable().optional(),
  shoot_date: z
    .string()
    .regex(DATE_REGEX, "shoot_date must be in YYYY-MM-DD format")
    .nullable()
    .optional(),
});

export default defineEventHandler(async (event) => {
  const { db, gallery } = await resolveGallery(event);

  const body = await readValidatedBody(event, bodySchema.parse);

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.client_name !== undefined) updateData.clientName = body.client_name;
  if (body.shoot_date !== undefined) updateData.shootDate = body.shoot_date;

  const updated = await updateGallery(db, gallery.id, updateData);

  if (!updated) {
    throw createError({
      statusCode: 500,
      message: "Failed to update gallery",
    });
  }

  return galleryToResponse(updated);
});
