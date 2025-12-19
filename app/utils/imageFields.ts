import type { InferSelectModel } from "drizzle-orm";
import type { images } from "~~/server/db/schema";
import imageSize from "image-size";

// Type derived from schema
export type ImageRecord = InferSelectModel<typeof images>;

// Update body interface
export interface ImageUpdateBody {
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

// Field update scope types
export type FieldUpdateScope =
  | "all_r2_path"
  | "single_record"
  | "context_scoped";

// Field configuration
export interface FieldConfig {
  scope: FieldUpdateScope;
  maxLength?: number;
  validator?: (value: any) => boolean | string;
  description?: string;
}

// Centralized field configurations
export const IMAGE_FIELD_CONFIGS: Record<
  keyof Omit<ImageUpdateBody, "add_contexts" | "remove_contexts">,
  FieldConfig
> = {
  alt: {
    scope: "all_r2_path",
    maxLength: 500,
    description: "Alt text applies to all contexts sharing the same image file",
  },
  description: {
    scope: "all_r2_path",
    description:
      "Description applies to all contexts sharing the same image file",
  },
  event_name: {
    scope: "single_record",
    description: "Event name applies only to the specific context",
  },
  event_date: {
    scope: "single_record",
    description: "Event date applies only to the specific context",
  },
  event_location: {
    scope: "single_record",
    description: "Event location applies only to the specific context",
  },
  is_primary: {
    scope: "context_scoped",
    description:
      "Primary status is context-specific and ensures only one primary per context",
  },
  is_public: {
    scope: "single_record",
    description: "Public visibility is specific to each context",
  },
  remove_layout: {
    scope: "single_record",
    description: "Removes the layout from the specific context",
  },
};

// Validation function
export function validateImageUpdate(body: ImageUpdateBody): {
  valid: boolean;
  error?: string;
} {
  // Check overlapping contexts
  if (body.add_contexts && body.remove_contexts) {
    const overlap = body.add_contexts.filter((c) =>
      body.remove_contexts!.includes(c)
    );
    if (overlap.length > 0) {
      return { valid: false, error: "Cannot add and remove same context" };
    }
  }

  // Check alt text length
  if (body.alt !== undefined) {
    const config = IMAGE_FIELD_CONFIGS.alt;
    if (config.maxLength && body.alt.length > config.maxLength) {
      return {
        valid: false,
        error: `Alt text max ${config.maxLength} characters`,
      };
    }
  }

  // Check description (no max length currently, but can be added)
  if (body.description !== undefined) {
    const config = IMAGE_FIELD_CONFIGS.description;
    if (config.maxLength && body.description.length > config.maxLength) {
      return {
        valid: false,
        error: `Description max ${config.maxLength} characters`,
      };
    }
  }

  return { valid: true };
}

// Type guard for updatable fields
export function isUpdatableField(
  key: string
): key is keyof Omit<ImageUpdateBody, "add_contexts" | "remove_contexts"> {
  return key in IMAGE_FIELD_CONFIGS;
}

// Helper to create new context record from existing image
export function createContextRecord(
  currentImage: ImageRecord,
  newContext: string
) {
  return {
    context: newContext,
    r2_path: currentImage.r2_path,
    url: currentImage.url,
    alt: currentImage.alt,
    description: currentImage.description,
    event_name: currentImage.event_name,
    event_date: currentImage.event_date,
    event_location: currentImage.event_location,
    width: currentImage.width,
    height: currentImage.height,
    file_size: currentImage.file_size,
    original_filename: currentImage.original_filename,
    is_primary: false,
    is_public: currentImage.is_public,
    uploaded_at: new Date(),
  };
}

// Confirm the endpoint body
export interface ImageConfirmBody {
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

export function createImageRecord(
  context: string,
  body: ImageConfirmBody,
  buffer: Buffer,
  r2PublicUrl: string
) {
  const dimensions = imageSize(buffer);
  const url = `${r2PublicUrl}/${body.r2_path}`;
  const filename = body.r2_path.split("/").pop() || "unknown.jpg";

  return {
    context,
    r2_path: body.r2_path,
    url,
    alt: body.alt || "",
    description: body.description || "",
    event_name: body.event_name || "",
    event_date: body.event_date || "",
    event_location: body.event_location || "",
    width: dimensions.width || 0,
    height: dimensions.height || 0,
    file_size: buffer.length,
    original_filename: filename,
    is_primary: body.is_primary ?? false,
    is_public: body.is_public ?? false,
    uploaded_at: new Date(),
  };
}
