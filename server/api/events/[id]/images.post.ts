import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import { addImageToEvent } from "~~/server/utils/mutations";

export default defineEventHandler(
  async (event): Promise<{ success: boolean }> => {
    await requireAuth(event);

    const db = useDB(event);
    const eventId = Number(getRouterParam(event, "id"));
    const body = await readBody<{
      image_instance_id: number;
      is_cover?: boolean;
    }>(event);

    if (!eventId || isNaN(eventId)) {
      throw createError({
        statusCode: 400,
        message: "Invalid event ID",
      });
    }

    if (!body.image_instance_id) {
      throw createError({
        statusCode: 400,
        message: "image_instance_id required",
      });
    }

    await addImageToEvent(
      db,
      eventId,
      body.image_instance_id,
      body.is_cover || false
    );

    return { success: true };
  }
);
