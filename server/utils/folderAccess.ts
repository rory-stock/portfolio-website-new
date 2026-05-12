import type { H3Event } from "h3";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "~~/server/db/schema";
import { getAccessCookie } from "~~/server/utils/accessCookie";

export type AccessGate = "private_link" | "access_code" | "email";

export interface AccessCheckResult {
  allowed: boolean;
  folderName?: string;
  requiredGates?: AccessGate[];
  rootFolderId?: number;
}

/**
 * Find the root folder.
 * Access control flags are only set on the root folder.
 */
export async function resolveRootFolder(
  db: DrizzleD1Database<typeof schema>,
  folderId: number
) {
  let currentId = folderId;
  let depth = 0;
  const maxDepth = 10; // Safety guard against circular references

  while (depth < maxDepth) {
    const [folder] = await db
      .select()
      .from(schema.imageFolders)
      .where(eq(schema.imageFolders.id, currentId))
      .limit(1);

    if (!folder) return null;

    if (!folder.parentFolderId) {
      return folder;
    }

    currentId = folder.parentFolderId;
    depth++;
  }

  return null;
}

/**
 * Validate whether a request has access to a folder's content.
 *
 * 1. Resolve the root folder
 * 2. Read access flags from the root folder
 * 3. If no flags are set → public folder, access is granted
 * 4. Check for valid access cookie
 * 5. Cookie must cover all active gates and not be expired
 */
export async function validateFolderAccess(
  event: H3Event,
  db: DrizzleD1Database<typeof schema>,
  folderId: number
): Promise<AccessCheckResult> {
  const rootFolder = await resolveRootFolder(db, folderId);

  if (!rootFolder) {
    return { allowed: false };
  }

  // Determine which gates are active
  const requiredGates: AccessGate[] = [];

  if (rootFolder.isPrivateLink) {
    requiredGates.push("private_link");
  }

  if (rootFolder.accessCode) {
    requiredGates.push("access_code");
  }

  if (rootFolder.requireEmail) {
    requiredGates.push("email");
  }

  // No gates → public folder
  if (requiredGates.length === 0) {
    return { allowed: true };
  }

  // Check for valid access cookie
  const cookie = await getAccessCookie(event, {
    id: rootFolder.id,
    accessVersion: rootFolder.accessVersion,
  });

  if (cookie) {
    // Verify cookie covers all active gates
    const allGatesCleared = requiredGates.every((gate) =>
      cookie.gatesCleared.includes(gate)
    );

    if (allGatesCleared) {
      return { allowed: true };
    }
  }

  return {
    allowed: false,
    folderName: rootFolder.name,
    requiredGates,
    rootFolderId: rootFolder.id,
  };
}

/**
 * Check if an image instance is in any folder that grants access.
 * Used by the download endpoint to verify access per-image.
 * Returns true if the image is in at least one accessible folder.
 */
export async function validateImageAccess(
  event: H3Event,
  db: DrizzleD1Database<typeof schema>,
  imageInstanceId: number
): Promise<boolean> {
  // Find all folders this image belongs to
  const folderLinks = await db
    .select({ folderId: schema.folderImages.folderId })
    .from(schema.folderImages)
    .where(eq(schema.folderImages.imageInstanceId, imageInstanceId));

  // If the image isn't in any folder, allow access (non-folder images are unrestricted)
  if (folderLinks.length === 0) {
    return true;
  }

  // Check each folder — if any grants access, allow the download
  for (const link of folderLinks) {
    const result = await validateFolderAccess(event, db, link.folderId);
    if (result.allowed) {
      return true;
    }
  }

  return false;
}
