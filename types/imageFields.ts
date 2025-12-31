/**
 * Centralized field definitions for image forms
 * Single source of truth for all image metadata fields across the application
 */

import type { ImageField } from "./imageTypes";

/**
 * Complete set of all possible image fields
 * Used by ImageDetailModal and admin pages
 */
export const ALL_IMAGE_FIELDS = {
  alt: {
    key: "alt",
    label: "Alt Text",
    type: "text",
    placeholder: "Describe the image for accessibility",
    editable: true,
  },
  description: {
    key: "description",
    label: "Description",
    type: "text",
    placeholder: "Optional description or caption",
    editable: true,
  },
  event_name: {
    key: "event_name",
    label: "Event Name",
    type: "text",
    placeholder: "Name of the event",
    editable: true,
  },
  event_date: {
    key: "event_date",
    label: "Event Date",
    type: "text",
    placeholder: "Date of the event",
    editable: true,
  },
  event_location: {
    key: "event_location",
    label: "Event Location",
    type: "text",
    placeholder: "Location of the event",
    editable: true,
  },
} as const satisfies Record<string, ImageField>;

/**
 * Field sets for different contexts
 * Predefined combinations for common use cases
 */
export const FIELD_SETS = {
  // Basic fields for most images
  basic: [ALL_IMAGE_FIELDS.alt],

  // Fields for images with descriptions (journal, info)
  withDescription: [ALL_IMAGE_FIELDS.alt, ALL_IMAGE_FIELDS.description],

  // Complete event fields (events page)
  events: [
    ALL_IMAGE_FIELDS.alt,
    ALL_IMAGE_FIELDS.event_name,
    ALL_IMAGE_FIELDS.event_date,
    ALL_IMAGE_FIELDS.event_location,
  ],

  // All available fields
  all: Object.values(ALL_IMAGE_FIELDS),
};

/**
 * Helper to get fields by keys
 */
export function getFieldsByKeys(
  keys: Array<keyof typeof ALL_IMAGE_FIELDS>
): ImageField[] {
  return keys.map((key) => ALL_IMAGE_FIELDS[key]);
}

/**
 * Helper to validate the field key
 */
export function isValidFieldKey(
  key: string
): key is keyof typeof ALL_IMAGE_FIELDS {
  return key in ALL_IMAGE_FIELDS;
}
