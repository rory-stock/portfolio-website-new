import { z } from "zod";
import { useDB } from "~~/server/db/client";
import * as schema from "~~/server/db/schema";
import { resolveRootFolder } from "~~/server/utils/folderAccess";
import type { AccessGate } from "~~/server/utils/folderAccess";
import { setAccessCookie, getAccessCookie } from "~~/server/utils/accessCookie";
import { and, eq } from "drizzle-orm";

const bodySchema = z.object({
  folder_id: z.number().int().positive(),
  email: z.email("Please enter a valid email address").optional(),
  access_code: z.string().optional(),
  token: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const db = useDB(event);
  const rawBody = await readBody(event);
  const result = bodySchema.safeParse(rawBody);

  if (!result.success) {
    const firstMessage = result.error.issues[0]?.message || "Invalid request";
    throw createError({ statusCode: 400, message: firstMessage });
  }

  const body = result.data;

  // Resolve root folder
  const rootFolder = await resolveRootFolder(db, body.folder_id);

  if (!rootFolder) {
    throw createError({ statusCode: 404, message: "Folder not found" });
  }

  const gatesCleared: AccessGate[] = [];
  const existingCookie = await getAccessCookie(event, {
    id: rootFolder.id,
    accessVersion: rootFolder.accessVersion,
  });

  // Carry forward any previously cleared gates
  if (existingCookie) {
    gatesCleared.push(...existingCookie.gatesCleared);
  }

  // Validate private link token
  if (rootFolder.isPrivateLink) {
    if (body.token && body.token === rootFolder.privateLinkToken) {
      if (!gatesCleared.includes("private_link")) {
        gatesCleared.push("private_link");
      }
    } else if (!gatesCleared.includes("private_link")) {
      // Token required but not provided or invalid
      if (body.token) {
        throw createError({
          statusCode: 403,
          message: "Invalid access token",
        });
      }
    }
  }

  // Validate access code
  if (rootFolder.accessCode) {
    if (body.access_code && body.access_code === rootFolder.accessCode) {
      if (!gatesCleared.includes("access_code")) {
        gatesCleared.push("access_code");
      }
    } else if (!gatesCleared.includes("access_code")) {
      if (body.access_code) {
        throw createError({
          statusCode: 403,
          message: "Invalid access code",
        });
      }
    }
  }

  // Validate email
  if (rootFolder.requireEmail) {
    if (body.email) {
      const [existing] = await db
        .select({ id: schema.folderAccessEmails.id })
        .from(schema.folderAccessEmails)
        .where(
          and(
            eq(schema.folderAccessEmails.folderId, rootFolder.id),
            eq(schema.folderAccessEmails.email, body.email)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(schema.folderAccessEmails)
          .set({ accessedAt: new Date() })
          .where(eq(schema.folderAccessEmails.id, existing.id));
      } else {
        await db.insert(schema.folderAccessEmails).values({
          folderId: rootFolder.id,
          email: body.email,
          accessedAt: new Date(),
          createdAt: new Date(),
        });
      }

      if (!gatesCleared.includes("email")) {
        gatesCleared.push("email");
      }
    } else if (!gatesCleared.includes("email")) {
      // Email required but not provided
    }
  }

  // Check if all required gates are cleared
  const requiredGates: AccessGate[] = [];
  if (rootFolder.isPrivateLink) requiredGates.push("private_link");
  if (rootFolder.accessCode) requiredGates.push("access_code");
  if (rootFolder.requireEmail) requiredGates.push("email");

  const allCleared = requiredGates.every((gate) => gatesCleared.includes(gate));

  if (!allCleared) {
    const remaining = requiredGates.filter(
      (gate) => !gatesCleared.includes(gate)
    );

    return {
      success: false,
      remaining_gates: remaining,
    };
  }

  // All gates cleared — set cookie
  await setAccessCookie(event, {
    rootFolderId: rootFolder.id,
    accessVersion: rootFolder.accessVersion,
    gatesCleared,
  });

  return { success: true };
});
