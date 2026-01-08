/**
 * Event system types
 * Separate domain for events, subpages, and related functionality
 */

// Base event type from the database
export interface EventBase {
  id: number;
  event_name: string;
  event_slug: string;
  event_date: string; // ISO format: YYYY-MM-DD
  event_location: string;
  event_cover_image_id: number | null;
  is_public: boolean;
  created_at: string | Date;
  updated_at: string | Date;
}

// Event subpage type from database
export interface EventSubpage {
  id: number;
  event_id: number;
  subpage_name: string;
  subpage_slug: string;
  subpage_date: string; // ISO format: YYYY-MM-DD (must be >= parent event_date)
  subpage_cover_image_id: number | null;
  created_at: string | Date;
  updated_at: string | Date;
}

// Extended event with subpages and metadata
export interface EventWithSubpages extends EventBase {
  subpages: EventSubpage[];
  image_count: number;
}

// Event with subpages and image counts per subpage
export interface EventWithDetails extends EventBase {
  subpages: EventSubpageWithCount[];
  main_gallery_count: number; // Images not in any subpage
  total_image_count: number; // All images for this event
}

// Subpage with image count
export interface EventSubpageWithCount extends EventSubpage {
  image_count: number;
}

// For event creation
export interface EventCreateData {
  event_name: string;
  event_slug: string;
  event_date: string;
  event_location: string;
  event_cover_image_id?: number | null;
  is_public?: boolean;
}

// For event updates
export interface EventUpdateData {
  event_name?: string;
  event_slug?: string;
  event_date?: string;
  event_location?: string;
  event_cover_image_id?: number | null;
  is_public?: boolean;
}

// For subpage creation
export interface SubpageCreateData {
  event_id: number;
  subpage_name: string;
  subpage_slug: string;
  subpage_date: string;
  subpage_cover_image_id?: number | null;
}

// For subpage updates
export interface SubpageUpdateData {
  subpage_name?: string;
  subpage_slug?: string;
  subpage_date?: string;
  subpage_cover_image_id?: number | null;
}
