import { eq } from "drizzle-orm";
import { useDB } from "~~/server/db/client";
import * as schema from "~~/server/db/schema";
import type { EventListResponse } from "~~/types/api";
import { getAllEvents, getSubEventCount } from "~~/server/utils/queries";
import { getFolderWithCover } from "~~/server/utils/queries/folders";
import { imageWithInstanceToDisplay } from "~~/server/utils/imageTransform";
import { eventToResponse } from "~~/server/utils/eventTransform";

export default defineEventHandler(async (event): Promise<EventListResponse> => {
  const db = useDB(event);

  // Get top-level events only
  const eventsData = await getAllEvents(db);

  const transformedEvents = await Promise.all(
    eventsData.map(async (eventData) => {
      if (!eventData) return null;

      const { event: eventRecord } = eventData;

      // Get cover image from the linked folder
      let coverImage = null;
      let totalImageCount = 0;

      if (eventRecord.folderId) {
        const folderData = await getFolderWithCover(db, eventRecord.folderId);

        if (folderData) {
          // Root folder count
          totalImageCount += folderData.folder.imageCount;

          if (folderData.coverImage) {
            coverImage = imageWithInstanceToDisplay({
              base: folderData.coverImage.base,
              instance: folderData.coverImage.instance,
              metadata: null,
              layout: null,
            });
          }
        }
      }

      // Sum image counts from sub-event folders
      const subEvents = await db
        .select({
          folderId: schema.events.folderId,
        })
        .from(schema.events)
        .where(eq(schema.events.parentEventId, eventRecord.id));

      for (const sub of subEvents) {
        if (sub.folderId) {
          const [folder] = await db
            .select({ imageCount: schema.imageFolders.imageCount })
            .from(schema.imageFolders)
            .where(eq(schema.imageFolders.id, sub.folderId));

          if (folder) {
            totalImageCount += folder.imageCount;
          }
        }
      }

      const subEventCount = await getSubEventCount(db, eventRecord.id);

      return {
        ...eventToResponse(eventRecord),
        cover_image: coverImage,
        images: [],
        image_count: totalImageCount,
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
