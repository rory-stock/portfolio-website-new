import type { H3Event } from "h3";
import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import { getFolderById } from "~~/server/utils/queries/folders";

/**
 * Resolve a folder by ID from the route params.
 * Handles auth, ID validation, and 404 in one call.
 */
export async function resolveFolder(event: H3Event) {
  await requireAuth(event);

  const db = useDB(event);
  const id = Number(getRouterParam(event, "id"));

  if (!id || isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: "Invalid folder ID",
    });
  }

  const folder = await getFolderById(db, id);

  if (!folder) {
    throw createError({
      statusCode: 404,
      message: "Folder not found",
    });
  }

  return { db, folder };
}
