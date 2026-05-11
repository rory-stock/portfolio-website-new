import type { H3Event } from "h3";
import type { AccessGate } from "~~/server/utils/folderAccess";

interface AccessCookieData {
  rootFolderId: number;
  gatesCleared: AccessGate[];
  expiry: number;
}

const COOKIE_PREFIX = "folder_access_";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

function getCookieName(rootFolderId: number): string {
  return `${COOKIE_PREFIX}${rootFolderId}`;
}

/**
 * Set an access cookie for a folder.
 * Uses Nuxt's signed cookie utilities
 */
export function setAccessCookie(
  event: H3Event,
  data: {
    rootFolderId: number;
    gatesCleared: AccessGate[];
  }
): void {
  const cookieData: AccessCookieData = {
    rootFolderId: data.rootFolderId,
    gatesCleared: data.gatesCleared,
    expiry: Date.now() + COOKIE_MAX_AGE * 1000,
  };

  setCookie(
    event,
    getCookieName(data.rootFolderId),
    JSON.stringify(cookieData),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    }
  );
}

/**
 * Read and parse an access cookie for a folder.
 * Returns null if the cookie is missing, malformed, or expired.
 */
export function getAccessCookie(
  event: H3Event,
  rootFolderId: number
): AccessCookieData | null {
  const raw = getCookie(event, getCookieName(rootFolderId));

  if (!raw) return null;

  try {
    const data: AccessCookieData = JSON.parse(raw);

    // Validate structure
    if (
      typeof data.rootFolderId !== "number" ||
      !Array.isArray(data.gatesCleared) ||
      typeof data.expiry !== "number"
    ) {
      return null;
    }

    // Validate folder ID matches
    if (data.rootFolderId !== rootFolderId) {
      return null;
    }

    // Check expiry
    if (data.expiry <= Date.now()) {
      // Clear expired cookie
      clearAccessCookie(event, rootFolderId);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Clear an access cookie for a folder.
 */
export function clearAccessCookie(event: H3Event, rootFolderId: number): void {
  deleteCookie(event, getCookieName(rootFolderId), {
    path: "/",
  });
}
