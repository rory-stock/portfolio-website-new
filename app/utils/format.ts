/**
 * Format file size from bytes to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.3 MB", "450 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const value = bytes / Math.pow(k, i);
  const formatted = i === 0 ? Math.floor(value) : value.toFixed(1);

  return `${formatted} ${sizes[i]}`;
}

/**
 * Format date to human-readable string
 * @param date - Date object or ISO string
 * @returns Formatted string (e.g., "Dec 28, 2025, 2:30 PM")
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format image dimensions
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns Formatted string (e.g., "1920 × 1080")
 */
export function formatDimensions(width: number, height: number): string {
  return `${width} × ${height}`;
}

/**
 * Format MIME type to human-readable format name
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

/**
 * Format elapsed time to human-readable relative string
 * @param date - Date object or ISO string
 * @returns Formatted string (e.g., "2 hours ago", "3 days ago")
 */
export function formatTimeRelative(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  if (diffWeek < 4) return `${diffWeek} week${diffWeek === 1 ? "" : "s"} ago`;
  if (diffMonth < 12)
    return `${diffMonth} month${diffMonth === 1 ? "" : "s"} ago`;
  return `${diffYear} year${diffYear === 1 ? "" : "s"} ago`;
}

/**
 * Format date to relative time string
 * @param date - Date object or ISO string
 * @returns Formatted string (e.g., "Today", "Yesterday", "2 days ago")
 */
export function formatDateRelative(date: Date | string): string {
  const targetDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return targetDate.toLocaleDateString();
}

/**
 * Format number with commas for readability
 * @param num - Number to format
 * @returns Formatted string (e.g., "1,234,567")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}
