import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import type { EventListResponse } from "~~/types/api";
import { getAllEvents, getEventCoverImage } from "~~/server/utils/queries";
import { imageWithInstanceToDisplay } from "~~/server/utils/imageTransform";
import { eventWithImagesToResponse } from "~~/server/utils/eventTransform";

export default defineEventHandler(async (event): Promise<EventListResponse> => {
  await requireAuth(event);

  const db = useDB(event);

  // Get all events
  const eventsData = await getAllEvents(db, { includeImages: true });

  // Transform to API format
  const transformedEvents = await Promise.all(
    eventsData.map(async (eventData) => {
      if (!eventData) return null;

      const { event, images } = eventData;

      // Get cover image
      const coverImageData = await getEventCoverImage(db, event.id);
      const coverImage = coverImageData
        ? imageWithInstanceToDisplay(coverImageData)
        : null;

      // Transform images to display format
      const displayImages = images.map((img) =>
        imageWithInstanceToDisplay(img)
      );

      return eventWithImagesToResponse(event, coverImage, displayImages);
    })
  );

  const filteredEvents = transformedEvents.filter(
    (e): e is NonNullable<typeof e> => e !== null
  );

  return {
    events: filteredEvents,
    total: filteredEvents.length,
  };
});
