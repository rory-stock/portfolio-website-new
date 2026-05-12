import type { H3Event } from "h3";
import type { AccessGate } from "~~/server/utils/folderAccess";

interface AccessCookieData {
  v: 1;
  rootFolderId: number;
  gatesCleared: AccessGate[];
  expiry: number;
}

const COOKIE_PREFIX = "folder_access_";
const COOKIE_MAX_AGE = 60 * 60 * 48; // 48 hours

let cachedSignKey: CryptoKey | null = null;
let cachedVerifyKey: CryptoKey | null = null;

function getCookieName(rootFolderId: number): string {
  return `${COOKIE_PREFIX}${rootFolderId}`;
}

function getSessionPassword(): string {
  const config = useRuntimeConfig();
  const password = config.session?.password;

  if (!password) {
    throw new Error("NUXT_SESSION_PASSWORD is required");
  }
  return password;
}

async function getSignKey(secret: string): Promise<CryptoKey> {
  if (cachedSignKey) {
    return cachedSignKey;
  }
  cachedSignKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );
  return cachedSignKey;
}

async function getVerifyKey(secret: string): Promise<CryptoKey> {
  if (cachedVerifyKey) {
    return cachedVerifyKey;
  }
  cachedVerifyKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["verify"]
  );
  return cachedVerifyKey;
}

function toBase64Url(input: string | Uint8Array): string {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);

  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await getSignKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

async function verify(signed: string, secret: string): Promise<string | null> {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) {
    return null;
  }
  const payload = signed.slice(0, lastDot);
  const signature = signed.slice(lastDot + 1);

  const key = await getVerifyKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(signature) as Uint8Array<ArrayBuffer>,
    new TextEncoder().encode(payload)
  );
  return valid ? payload : null;
}

function getCookiePath(pathname?: string): string {
  if (!pathname) {
    return "/";
  }

  if (pathname.startsWith("/events/")) {
    return "/events/";
  }

  if (pathname.startsWith("/gallery/")) {
    return "/gallery/";
  }

  return "/";
}

export async function setAccessCookie(
  event: H3Event,
  data: {
    rootFolderId: number;
    gatesCleared: AccessGate[];
  }
): Promise<void> {
  const cookieData: AccessCookieData = {
    v: 1,
    rootFolderId: data.rootFolderId,
    gatesCleared: data.gatesCleared,
    expiry: Date.now() + COOKIE_MAX_AGE * 1000,
  };

  const payload = toBase64Url(JSON.stringify(cookieData));
  const signed = await sign(payload, getSessionPassword());

  setCookie(event, getCookieName(data.rootFolderId), signed, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: getCookiePath(event.path),
  });
}

export async function getAccessCookie(
  event: H3Event,
  rootFolderId: number
): Promise<AccessCookieData | null> {
  const raw = getCookie(event, getCookieName(rootFolderId));
  if (!raw) {
    return null;
  }
  try {
    const verifiedPayload = await verify(raw, getSessionPassword());
    if (!verifiedPayload) {
      clearAccessCookie(event, rootFolderId);
      return null;
    }

    const decoded = new TextDecoder().decode(fromBase64Url(verifiedPayload));
    const data = JSON.parse(decoded) as AccessCookieData;

    if (
      data.v !== 1 ||
      typeof data.rootFolderId !== "number" ||
      !Array.isArray(data.gatesCleared) ||
      typeof data.expiry !== "number"
    ) {
      clearAccessCookie(event, rootFolderId);
      return null;
    }

    if (data.rootFolderId !== rootFolderId) {
      clearAccessCookie(event, rootFolderId);
      return null;
    }

    if (data.expiry <= Date.now()) {
      clearAccessCookie(event, rootFolderId);
      return null;
    }

    return data;
  } catch {
    clearAccessCookie(event, rootFolderId);
    return null;
  }
}

export function clearAccessCookie(event: H3Event, rootFolderId: number): void {
  deleteCookie(event, getCookieName(rootFolderId), {
    path: getCookiePath(event.path),
  });
}
