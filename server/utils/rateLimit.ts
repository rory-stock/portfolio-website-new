import { DOWNLOAD_RATE_LIMITS } from "~/utils/constants";

/**
 * Progressive in-memory rate limiter for image downloads.
 *
 * Uses multiple sliding windows — the longer someone sustains high download rates,
 * the stricter it gets. Keyed by IP address.
 *
 * Windows (from constants):
 * - 30 per minute
 * - 80 per 10 minutes
 * - 200 per hour
 */

interface RateLimitResult {
  allowed: boolean;
  retryAfter: number; // seconds until the earliest window resets enough to allow a request
}

// Store timestamps of each download per IP
const downloadLog = new Map<string, number[]>();

// Clean-up interval — remove stale entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const MAX_WINDOW_MS = Math.max(
  ...DOWNLOAD_RATE_LIMITS.windows.map((w) => w.windowMs)
);

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    const cutoff = now - MAX_WINDOW_MS;

    for (const [ip, timestamps] of downloadLog.entries()) {
      // Remove timestamps older than the largest window
      const filtered = timestamps.filter((t) => t > cutoff);

      if (filtered.length === 0) {
        downloadLog.delete(ip);
      } else {
        downloadLog.set(ip, filtered);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Check if a request is allowed under all rate limit windows.
 * If blocked, returns the number of seconds until the earliest window frees up.
 */
export function checkRateLimit(ip: string): RateLimitResult {
  startCleanup();

  const now = Date.now();
  const timestamps = downloadLog.get(ip) || [];

  // Check each window
  for (const window of DOWNLOAD_RATE_LIMITS.windows) {
    const windowStart = now - window.windowMs;
    const requestsInWindow = timestamps.filter((t) => t > windowStart).length;

    if (requestsInWindow >= window.maxRequests) {
      // Find the oldest timestamp in this window — that's when the window
      // will "lose" a request and free up a slot
      const windowTimestamps = timestamps
        .filter((t) => t > windowStart)
        .sort((a, b) => a - b);

      const oldestInWindow = windowTimestamps[0] || now;
      const retryAfterMs = oldestInWindow + window.windowMs - now;
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

      return {
        allowed: false,
        retryAfter: Math.max(1, retryAfterSeconds),
      };
    }
  }

  return { allowed: true, retryAfter: 0 };
}

/**
 * Record a successful download for rate-limiting purposes.
 * Call this AFTER the download has been initiated, not before.
 */
export function recordDownload(ip: string): void {
  const timestamps = downloadLog.get(ip) || [];
  timestamps.push(Date.now());
  downloadLog.set(ip, timestamps);
}

/**
 * Get the client IP from the request event.
 * Checks Cloudflare headers first, then falls back to standard headers.
 */
export function getClientIp(event: any): string {
  const headers = getRequestHeaders(event);

  // Cloudflare Workers always set this
  const cfIp = headers["cf-connecting-ip"];
  if (cfIp) return cfIp;

  // Fallback for dev/other proxies
  const forwarded = headers["x-forwarded-for"];
  if (forwarded) {
    const first = forwarded.split(",")[0];
    if (first) return first.trim();
  }

  const realIp = headers["x-real-ip"];
  if (realIp) return realIp;

  return "unknown";
}
