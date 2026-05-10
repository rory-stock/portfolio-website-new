import type { Gallery } from "~~/types/database";
import type { DisplayImage } from "~~/types/imageTypes";

export interface GalleryResponse {
  id: number;
  name: string;
  slug: string;
  folder_id: number;
  client_name: string | null;
  shoot_date: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface GalleryListItemResponse extends GalleryResponse {
  cover_image: DisplayImage | null;
  image_count: number;
}

/**
 * Transform the database gallery to API response format
 */
export function galleryToResponse(gallery: Gallery): GalleryResponse {
  return {
    id: gallery.id,
    name: gallery.name,
    slug: gallery.slug,
    folder_id: gallery.folderId,
    client_name: gallery.clientName,
    shoot_date: gallery.shootDate,
    created_at: gallery.createdAt,
    updated_at: gallery.updatedAt,
  };
}
