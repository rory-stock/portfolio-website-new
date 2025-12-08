/**
 * Format bytes into human-readable file size
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.3 MB", "450 KB", "128 B")
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
