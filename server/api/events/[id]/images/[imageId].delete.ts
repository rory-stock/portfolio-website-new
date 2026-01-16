import { eq, and } from "drizzle-orm";
import { useDB } from "~~/server/db/client";
import * as schema from "~~/server/db/schema";
import { requireAuth } from "~~/server/utils/requireAuth";

export default defineEventHandler(
  async (event): Promise<{ success: boolean }> => {
    await requireAuth(event);

    const db = useDB(event);
    const eventId = Number(getRouterParam(event, "id"));
    const imageId = Number(getRouterParam(event, "imageId"));

    if (!eventId || isNaN(eventId) || !imageId || isNaN(imageId)) {
      throw createError({
        statusCode: 400,
        message: "Invalid event ID or image ID",
      });
    }

    // Delete the event_images link (does NOT delete the image_instance)
    await db
      .delete(schema.eventImages)
      .where(
        and(
          eq(schema.eventImages.eventId, eventId),
          eq(schema.eventImages.imageInstanceId, imageId)
        )
      );

    return { success: true };
  }
);
