/**
 * File upload constraints and validation constants
 * Centralized location for all file-related limits and valid types
 */

// File size limits (in bytes)
export const MAX_FILE_SIZE = 60 * 1024 * 1024; // 60MB
export const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB

export const fileConstraints = {
  maxFileSize: MAX_FILE_SIZE,
  largeFileThreshold: LARGE_FILE_THRESHOLD,
} as const;

// Meta image constraints
export const metaImageConstraints = {
  width: 1200,
  height: 675,
  label: "Meta Image (Twitter/OG)",
  ogWidth: 1200,
  ogHeight: 630,
} as const;

// Valid MIME types for uploads
export const VALID_IMAGE_TYPES = ["image/jpeg", "image/webp"] as const;

// Valid file extensions
export const VALID_IMAGE_EXTENSIONS = ["jpg", "jpeg", "webp"] as const;

// Type exports for type safety
export type ValidImageType = (typeof VALID_IMAGE_TYPES)[number];
export type ValidImageExtension = (typeof VALID_IMAGE_EXTENSIONS)[number];
