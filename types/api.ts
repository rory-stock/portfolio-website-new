/**
 * Centralized API type definitions
 * Shared types between client and server for type safety
 */

import type { DisplayImage } from "./imageTypes";

// ==================== Content API ====================

export interface ContentItem {
  key: string;
  value: string;
}

export interface ContentUpdateRequest {
  table: string;
  updates: Array<{
    key: string;
    value: string;
  }>;
}

export interface ContentResponse {
  success: boolean;
}

// ==================== Images API ====================

export interface ImageUploadUrlRequest {
  filename: string;
  context: string;
  fileSize?: number;
}

export interface ImageUploadUrlResponse {
  uploadUrl: string;
  r2_path: string;
}

export interface ImageConfirmRequest {
  r2_path: string;
  context: string;
  alt?: string;
  description?: string;
  event_name?: string;
  event_date?: string;
  event_location?: string;
  is_primary?: boolean;
  is_public?: boolean;
  additionalContexts?: string[];
}

export interface ImageConfirmResponse {
  success: boolean;
  images: Array<{ id: number }>;
}

export interface ImageUpdateRequest {
  alt?: string;
  description?: string;
  event_name?: string;
  event_date?: string;
  event_location?: string;
  is_primary?: boolean;
  is_public?: boolean;
  add_contexts?: string[];
  remove_contexts?: string[];
  remove_layout?: boolean;
}

export interface ImageUpdateResponse {
  success: boolean;
  image: DisplayImage;
  all_contexts?: DisplayImage[];
  layout_removed?: boolean;
  group_was_removed?: boolean;
}

export interface ImageListRequest {
  context?: string;
  is_primary?: boolean;
  r2_path?: string;
  include_layouts?: boolean;
}

export interface ImageListResponse {
  images: DisplayImage[];
  total: number;
}

export interface ImageDeleteResponse {
  success: boolean;
  id: number;
}

export interface ImageReorderRequest {
  context: string;
  order: number[];
}

export interface ImageReorderResponse {
  success: boolean;
  images: DisplayImage[];
}

// ==================== Layout API ====================

export interface LayoutAssignRequest {
  image_ids: number[];
  layout_type: string;
  context: string;
}

export interface LayoutAssignResponse {
  success: boolean;
  images: DisplayImage[];
  group_id: number | null;
}

// ==================== Admin API ====================

export interface ContextListResponse {
  contexts: readonly string[];
}

// ==================== Cleanup API ====================

export interface OrphanedFile {
  key: string;
  size: number;
  lastModified: string;
}

export interface OrphanedFilesResponse {
  orphaned: OrphanedFile[];
  total: number;
}

export interface CleanupResponse {
  success: boolean;
  deleted: number;
  failed: number;
  errors: Array<{ key: string; error: any }>;
}

// ==================== Auth API ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
}

export interface LogoutResponse {
  success: boolean;
}

// ==================== Events API ====================

export interface EventCreateRequest {
  name: string;
  start_date: string;
  end_date?: string;
  location: string;
  description?: string;
  external_url?: string;
}

export interface EventUpdateRequest extends Partial<EventCreateRequest> {
  id: number;
}

export interface EventResponse {
  id: number;
  name: string;
  slug: string;
  start_date: string;
  end_date?: string | null;
  location: string;
  description?: string | null;
  external_url?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface EventWithImagesResponse extends EventResponse {
  cover_image?: DisplayImage | null;
  images: DisplayImage[];
  image_count: number;
}

export interface EventListResponse {
  events: EventWithImagesResponse[];
  total: number;
}

// ==================== Meta Images API ====================

export interface MetaImageUploadRequest {
  context: string;
}

export interface MetaImageUploadResponse {
  success: boolean;
  url: string;
  context: string;
}

export interface MetaImageDeleteRequest {
  context: string;
}

export interface MetaImageDeleteResponse {
  success: boolean;
  deleted: boolean;
  path: string;
}

export interface MetaCachePurgeRequest {
  context: string;
}

export interface MetaCachePurgeResponse {
  success: boolean;
  purged: boolean;
  url?: string;
}
