import type { H3Event } from "h3";
import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import { getGalleryBySlug } from "~~/server/utils/queries/galleries";

/**
 * Resolve a gallery by slug from the route params.
 * Handles auth, slug validation, and 404 in one call.
 */
export async function resolveGallery(event: H3Event) {
  await requireAuth(event);

  const db = useDB(event);
  const slug = getRouterParam(event, "slug");

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: "Slug required",
    });
  }

  const gallery = await getGalleryBySlug(db, slug);

  if (!gallery) {
    throw createError({
      statusCode: 404,
      message: "Gallery not found",
    });
  }

  return { db, gallery };
}
