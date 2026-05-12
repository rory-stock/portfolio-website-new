import type { H3Event } from "h3";
import type { AccessGate } from "~~/server/utils/folderAccess";

interface AccessCookieData {
  v: 1;
  rootFolderId: number;
  accessVersion: number;
  gatesCleared: AccessGate[];
  expiry: number;
}

const COOKIE_PREFIX = "folder_access_";
const COOKIE_MAX_AGE = 60 * 60 * 48; // 48 hours

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const keyCache = new Map<string, CryptoKey>();

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

async function getKey(
  secret: string,
  usage: "sign" | "verify"
): Promise<CryptoKey> {
  const cacheKey = `${usage}:${secret}`;
  const existing = keyCache.get(cacheKey);

  if (existing) {
    return existing;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    [usage]
  );

  keyCache.set(cacheKey, key);
  return key;
}

function toBase64Url(input: string | Uint8Array): string {
  const bytes =
    typeof input === "string" ? encoder.encode(input) : input;
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
  const key = await getKey(secret, "sign");
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
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

  const key = await getKey(secret, "verify");
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(signature) as Uint8Array<ArrayBuffer>,
    encoder.encode(payload)
  );
  return valid ? payload : null;
}

function getCookiePath(pathname?: string): string {
  if (!pathname) return "/";

  const match = pathname.match(/^\/(gallery|events)\/[^/]+/);
  return match ? `${match[0]}/` : "/";
}

export async function setAccessCookie(
  event: H3Event,
  data: {
    rootFolderId: number;
    accessVersion: number;
    gatesCleared: AccessGate[];
  }
): Promise<void> {
  const cookieData: AccessCookieData = {
    v: 1,
    rootFolderId: data.rootFolderId,
    accessVersion: data.accessVersion,
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
    path: getCookiePath(getRequestURL(event).pathname),
  });
}

export async function getAccessCookie(
  event: H3Event,
  folder: {
    id: number;
    accessVersion: number;
  }
): Promise<AccessCookieData | null> {
  const raw = getCookie(event, getCookieName(folder.id));
  if (!raw) {
    return null;
  }
  try {
    const verifiedPayload = await verify(raw, getSessionPassword());
    if (!verifiedPayload) {
      clearAccessCookie(event, folder.id);
      return null;
    }

    const decoded = decoder.decode(fromBase64Url(verifiedPayload));
    const data = JSON.parse(decoded) as AccessCookieData;

    if (
      data.v !== 1 ||
      typeof data.rootFolderId !== "number" ||
      typeof data.accessVersion !== "number" ||
      !Array.isArray(data.gatesCleared) ||
      typeof data.expiry !== "number"
    ) {
      clearAccessCookie(event, folder.id);
      return null;
    }

    if (data.rootFolderId !== folder.id) {
      clearAccessCookie(event, folder.id);
      return null;
    }

    if (data.accessVersion !== folder.accessVersion) {
      clearAccessCookie(event, folder.id);
      return null;
    }

    if (data.expiry <= Date.now()) {
      clearAccessCookie(event, folder.id);
      return null;
    }

    return data;
  } catch {
    clearAccessCookie(event, folder.id);
    return null;
  }
}

export function clearAccessCookie(event: H3Event, rootFolderId: number): void {
  deleteCookie(event, getCookieName(rootFolderId), {
    path: getCookiePath(getRequestURL(event).pathname),
  });
}
