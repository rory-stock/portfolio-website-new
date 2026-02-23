import { useDB } from "~~/server/db/client";
import {
  getSubEvents,
  getEventCoverImage,
  getSubEventCount,
} from "~~/server/utils/queries";
import { imageWithInstanceToDisplay } from "~~/server/utils/imageTransform";
import { eventWithImagesToResponse } from "~~/server/utils/eventTransform";

export default defineEventHandler(async (event) => {
  const db = useDB(event);
  const parentId = Number(getRouterParam(event, "id"));

  if (!parentId || isNaN(parentId)) {
    throw createError({ statusCode: 400, message: "Invalid event ID" });
  }

  const subEventsData = await getSubEvents(db, parentId, {
    includeImages: true,
  });

  const transformedEvents = await Promise.all(
    subEventsData.map(async (eventData) => {
      if (!eventData) return null;

      const { event: eventRecord, images } = eventData;

      const coverImageData = await getEventCoverImage(db, eventRecord.id);
      const coverImage = coverImageData
        ? imageWithInstanceToDisplay(coverImageData)
        : null;

      const displayImages = images.map((img) =>
        imageWithInstanceToDisplay(img)
      );

      const subEventCount = await getSubEventCount(db, eventRecord.id);

      const response = eventWithImagesToResponse(
        eventRecord,
        coverImage,
        displayImages
      );

      return {
        ...response,
        sub_event_count: subEventCount,
        folder_id: eventRecord.folderId,
      };
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
