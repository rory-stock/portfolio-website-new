import { z } from "zod";
import { eq } from "drizzle-orm";
import { useDB } from "~~/server/db/client";
import * as schema from "~~/server/db/schema";
import { requireAuth } from "~~/server/utils/requireAuth";
import { getFolderById } from "~~/server/utils/queries/folders";
import { generatePrivateLinkToken } from "~~/server/utils/tokenGenerator";

const bodySchema = z.object({
  is_private_link: z.boolean().optional(),
  access_code: z.string().nullable().optional(),
  require_email: z.boolean().optional(),
  regenerate_token: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const db = useDB(event);
  const id = Number(getRouterParam(event, "id"));

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid folder ID" });
  }

  const folder = await getFolderById(db, id);
  if (!folder) {
    throw createError({ statusCode: 404, message: "Folder not found" });
  }

  const body = await readValidatedBody(event, bodySchema.parse);

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
    accessVersion: (folder.accessVersion) + 1,
  };

  // Handle private link toggle
  if (body.is_private_link !== undefined) {
    updates.isPrivateLink = body.is_private_link;

    if (body.is_private_link && !folder.privateLinkToken) {
      updates.privateLinkToken = generatePrivateLinkToken();
    } else if (!body.is_private_link) {
      updates.privateLinkToken = null;
    }
  }

  // Handle token regeneration
  if (body.regenerate_token && (body.is_private_link ?? folder.isPrivateLink)) {
    updates.privateLinkToken = generatePrivateLinkToken();
  }

  // Handle access code
  if (body.access_code !== undefined) {
    updates.accessCode = body.access_code;
  }

  // Handle email gate toggle
  if (body.require_email !== undefined) {
    updates.requireEmail = body.require_email;
  }

  const [updated] = await db
    .update(schema.imageFolders)
    .set(updates)
    .where(eq(schema.imageFolders.id, id))
    .returning();

  if (!updated) {
    throw createError({
      statusCode: 500,
      message: "Failed to update access settings",
    });
  }

  return {
    success: true,
    access: {
      is_private_link: updated.isPrivateLink,
      private_link_token: updated.privateLinkToken,
      access_code: updated.accessCode,
      require_email: updated.requireEmail,
    },
  };
});
