import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import type { EventWithImagesResponse } from "~~/types/api";
import {
  getEventBySlug,
  getEventCoverImage,
} from "~~/server/utils/queries/events";
import { imageWithInstanceToDisplay } from "~~/server/utils/imageTransform";
import { eventWithImagesToResponse } from "~~/server/utils/eventTransform";

export default defineEventHandler(
  async (event): Promise<EventWithImagesResponse> => {
    await requireAuth(event);

    const db = useDB(event);
    const slug = getRouterParam(event, "slug");

    if (!slug) {
      throw createError({
        statusCode: 400,
        message: "Slug required",
      });
    }

    const eventData = await getEventBySlug(db, slug, true);

    if (!eventData) {
      throw createError({
        statusCode: 404,
        message: "Event not found",
      });
    }

    const { event: eventRecord, images } = eventData;

    // Get cover image
    const coverImageData = await getEventCoverImage(db, eventRecord.id);
    const coverImage = coverImageData
      ? imageWithInstanceToDisplay(coverImageData)
      : null;

    // Transform images to display format
    const displayImages = images.map((img) => imageWithInstanceToDisplay(img));

    return eventWithImagesToResponse(eventRecord, coverImage, displayImages);
  }
);
