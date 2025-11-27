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
