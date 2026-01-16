import type { Event } from "~~/types/database";
import type { EventResponse, EventWithImagesResponse } from "~~/types/api";
import type { DisplayImage } from "~~/types/imageTypes";

/**
 * Transform database event to API response format
 */
export function eventToResponse(event: Event): EventResponse {
  return {
    id: event.id,
    name: event.name,
    slug: event.slug,
    start_date: event.startDate,
    end_date: event.endDate,
    location: event.location,
    description: event.description,
    external_url: event.externalUrl,
    created_at: event.createdAt,
    updated_at: event.updatedAt,
  };
}

/**
 * Transform event with images to API response format
 */
export function eventWithImagesToResponse(
  event: Event,
  coverImage: DisplayImage | null,
  images: DisplayImage[]
): EventWithImagesResponse {
  return {
    ...eventToResponse(event),
    cover_image: coverImage,
    images,
    image_count: images.length,
  };
}
