/**
 * Format MIME type into human-readable format name
 * @param mimeType - MIME type string (e.g. "image/jpeg")
 * @returns Formatted string (e.g., "JPEG", "PNG", "WebP")
 */
export function formatMimeType(mimeType: string): string {
  const mimeTypeMap: Record<string, string> = {
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WebP",
  };

  return mimeTypeMap[mimeType] || mimeType;
}

/**
 * Get comma-separated list of valid image format names
 * @returns Formatted string (e.g., "JPEG, PNG, WebP")
 */
export function getValidImageFormats(): string {
  return VALID_IMAGE_TYPES.map(formatMimeType).join(", ");
}
