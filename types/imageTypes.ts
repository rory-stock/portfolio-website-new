// Shared types for images across client and server

export interface ImageBase {
  id: number;
  r2_path: string;
  url: string;
  alt: string;
  description: string;
  width: number;
  height: number;
  file_size: number;
  original_filename: string;
  uploaded_at: string | Date;
  is_public: boolean;
}

// Extended interface for records that include context
export interface ImageWithContext extends ImageBase {
  context: string;
  is_primary: boolean;
}

// Field definition for UI forms
export interface ImageFieldDefinition {
  key: keyof ImageBase;
  label: string;
  type?: "text" | "textarea" | "email" | "url";
  rows?: number;
  placeholder?: string;
  editable?: boolean;
}

// Standard editable fields configuration
export const EDITABLE_IMAGE_FIELDS: ImageFieldDefinition[] = [
  {
    key: "alt",
    label: "Alt Text",
    type: "text",
    placeholder: "Describe the image for accessibility",
    editable: true,
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    rows: 3,
    placeholder: "Optional detailed description",
    editable: true,
  },
] as const;
