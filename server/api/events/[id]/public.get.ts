import { eq, asc } from "drizzle-orm";
import { useDB } from "~~/server/db/client";
import * as schema from "~~/server/db/schema";
import { imageWithInstanceToDisplay } from "~~/server/utils/imageTransform";
import { getFolderImages } from "~~/server/utils/queries/folders";
import { validateFolderAccess } from "~~/server/utils/folderAccess";

interface PublicSubEvent {
  id: number;
  name: string;
  slug: string;
  start_date: string;
  location: string;
  images: ReturnType<typeof imageWithInstanceToDisplay>[];
}

interface PublicEventResponse {
  requiresAccess?: boolean;
  folderName?: string;
  requiredGates?: string[];
  rootFolderId?: number;
  id: number;
  name: string;
  slug: string;
  start_date: string;
  end_date: string | null;
  location: string;
  description: string | null;
  external_url: string | null;
  sub_events?: PublicSubEvent[];
  images?: ReturnType<typeof imageWithInstanceToDisplay>[];
}

export default defineEventHandler(
  async (event): Promise<PublicEventResponse> => {
    const db = useDB(event);
    const slug = getRouterParam(event, "id");

    if (!slug) {
      throw createError({ statusCode: 400, message: "Slug required" });
    }

    // Get the event by slug (top-level only)
    const [eventRecord] = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.slug, slug))
      .limit(1);

    if (!eventRecord) {
      throw createError({ statusCode: 404, message: "Event not found" });
    }

    // Check folder access control
    if (eventRecord.folderId) {
      const accessResult = await validateFolderAccess(
        event,
        db,
        eventRecord.folderId
      );

      if (!accessResult.allowed) {
        return {
          requiresAccess: true,
          folderName: accessResult.folderName || eventRecord.name,
          requiredGates: accessResult.requiredGates || [],
          rootFolderId: accessResult.rootFolderId,
          id: eventRecord.id,
          name: eventRecord.name,
          slug: eventRecord.slug,
          start_date: eventRecord.startDate,
          end_date: eventRecord.endDate,
          location: eventRecord.location,
          description: eventRecord.description,
          external_url: eventRecord.externalUrl,
        };
      }
    }

    // Access granted — return full data

    // Get sub-events
    const subEvents = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.parentEventId, eventRecord.id))
      .orderBy(
        asc(schema.events.startDate),
        asc(schema.events.createdAt),
        asc(schema.events.name)
      );

    if (subEvents.length > 0) {
      // Has sub-events — fetch folder images for each
      const subEventData: PublicSubEvent[] = await Promise.all(
        subEvents.map(async (sub) => {
          let images: ReturnType<typeof imageWithInstanceToDisplay>[] = [];

          if (sub.folderId) {
            const result = await getFolderImages(db, sub.folderId, {
              page: 1,
              limit: 500,
            });
            images = result.images.map((imgData) =>
              imageWithInstanceToDisplay(imgData)
            );
          }

          return {
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            start_date: sub.startDate,
            location: sub.location,
            images,
          };
        })
      );

      return {
        id: eventRecord.id,
        name: eventRecord.name,
        slug: eventRecord.slug,
        start_date: eventRecord.startDate,
        end_date: eventRecord.endDate,
        location: eventRecord.location,
        description: eventRecord.description,
        external_url: eventRecord.externalUrl,
        sub_events: subEventData,
        images: [],
      };
    }

    // No sub-events — fetch root folder images
    let rootImages: ReturnType<typeof imageWithInstanceToDisplay>[] = [];

    if (eventRecord.folderId) {
      const result = await getFolderImages(db, eventRecord.folderId, {
        page: 1,
        limit: 500,
      });
      rootImages = result.images.map((imgData) =>
        imageWithInstanceToDisplay(imgData)
      );
    }

    return {
      id: eventRecord.id,
      name: eventRecord.name,
      slug: eventRecord.slug,
      start_date: eventRecord.startDate,
      end_date: eventRecord.endDate,
      location: eventRecord.location,
      description: eventRecord.description,
      external_url: eventRecord.externalUrl,
      sub_events: [],
      images: rootImages,
    };
  }
);
