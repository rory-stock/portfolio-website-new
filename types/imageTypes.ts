// Shared types for images across client and server

import type { LayoutTypeId } from "~/utils/layouts";
import type {
  BaseImage,
  ImageInstance,
  ImageMetadata,
  ImageLayout,
} from "./database";

// ==================== Core Combined Interface ====================
export interface ImageWithInstance {
  base: BaseImage;
  instance: ImageInstance;
  metadata?: ImageMetadata | null;
  layout?: ImageLayout | null;
}

// ==================== Display Interface for Frontend ====================
export interface DisplayImage {
  id: number;
  instanceId: number;
  context: string;
  r2_path: string;
  url: string;
  alt: string;
  description?: string | null;
  width: number;
  height: number;
  file_size: number;
  original_filename: string;
  is_public: boolean;
  is_primary: boolean;
  order?: number | null;
  layout_type?: LayoutTypeId | null;
  layout_group_id?: number | null;
  group_display_order?: number | null;
  captured_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

// ==================== UI Form Fields ====================
export interface ImageField {
  key: string;
  label: string;
  type?: "text" | "textarea" | "email" | "url";
  rows?: number;
  placeholder?: string;
  editable?: boolean;
}

// ==================== Snap/Layout Display Types ====================
export interface SnapImage {
  id: string | number;
  url: string;
  alt: string | null;
  r2_path?: string;
  description?: string | null;
  layout_type: LayoutTypeId | null;
  [key: string]: any;
}

export interface SnapSection {
  layoutType: LayoutTypeId | null;
  images: SnapImage[];
}

// Helper type for grouped images in the admin UI
export interface ImageGroup {
  group_id: number;
  layout_type: LayoutTypeId;
  images: DisplayImage[];
  display_order: number;
}
