// Shared types for images across client and server

export interface ImageBase {
  id: number;
  context: string;
  r2_path: string;
  url: string;
  alt: string;
  description: string;
  event_name: string;
  event_date: string;
  event_location: string;
  width: number;
  height: number;
  file_size: number;
  original_filename: string;
  uploaded_at: string | Date;
  is_public: boolean;
  is_primary: boolean;
  order: number | null;
  layout_type: string | null;
  layout_group_id: number | null;
  group_display_order: number | null;
}

// Extended interface for records that include context
export interface ImageWithContext extends ImageBase {
  context: string;
  is_primary: boolean;
}

// Field definition for UI forms
export interface ImageField {
  key: keyof ImageBase;
  label: string;
  type?: "text" | "textarea" | "email" | "url";
  rows?: number;
  placeholder?: string;
  editable?: boolean;
}

export interface SnapImage {
  id: string | number;
  url: string;
  alt: string | null;
  r2_path?: string;
  description?: string | null;
  layout_type: string | null;
  [key: string]: any;
}

export interface SnapSection {
  layoutType: string | null;
  images: SnapImage[];
}

// Helper type for grouped images in the admin UI
export interface ImageGroup {
  group_id: number;
  layout_type: string;
  images: ImageBase[];
  display_order: number;
}

// Lightweight proxy for vuedraggable compatibility
export interface ImageGroupProxy {
  type: "group-proxy";
  group_id: number;
  layout_type: string;
  display_order: number;
}
