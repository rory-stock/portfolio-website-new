import { eq, asc } from "drizzle-orm";
import { useDB } from "~~/server/db/client";
import * as schema from "~~/server/db/schema";
import { imageWithInstanceToDisplay } from "~~/server/utils/imageTransform";
import { getFolderImages } from "~~/server/utils/queries/folders";
import { validateFolderAccess } from "~~/server/utils/folderAccess";

interface PublicSubFolder {
  id: number;
  name: string;
  slug: string;
  images: ReturnType<typeof imageWithInstanceToDisplay>[];
}

export default defineEventHandler(async (event) => {
  const db = useDB(event);
  const slug = getRouterParam(event, "id");

  if (!slug) {
    throw createError({ statusCode: 400, message: "Slug required" });
  }

  // Get gallery by slug
  const [gallery] = await db
    .select()
    .from(schema.galleries)
    .where(eq(schema.galleries.slug, slug))
    .limit(1);

  if (!gallery) {
    throw createError({ statusCode: 404, message: "Gallery not found" });
  }

  // Check folder access control
  const accessResult = await validateFolderAccess(event, db, gallery.folderId);

  if (!accessResult.allowed) {
    return {
      requiresAccess: true,
      folderName: accessResult.folderName || gallery.name,
      requiredGates: accessResult.requiredGates || [],
      rootFolderId: accessResult.rootFolderId,
      id: gallery.id,
      name: gallery.name,
      slug: gallery.slug,
      client_name: gallery.clientName,
      shoot_date: gallery.shootDate,
    };
  }

  // Access granted — return full data

  // Get subfolders
  const subFolders = await db
    .select()
    .from(schema.imageFolders)
    .where(eq(schema.imageFolders.parentFolderId, gallery.folderId))
    .orderBy(asc(schema.imageFolders.name));

  if (subFolders.length > 0) {
    // Has subfolders — fetch images for each
    const subFolderData: PublicSubFolder[] = await Promise.all(
      subFolders.map(async (sub) => {
        const result = await getFolderImages(db, sub.id, {
          page: 1,
          limit: 500,
        });

        const images = result.images.map((imgData) =>
          imageWithInstanceToDisplay(imgData)
        );

        return {
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          images,
        };
      })
    );

    return {
      requiresAccess: false,
      id: gallery.id,
      name: gallery.name,
      slug: gallery.slug,
      client_name: gallery.clientName,
      shoot_date: gallery.shootDate,
      sub_folders: subFolderData,
      images: [],
    };
  }

  // No subfolders — fetch root folder images
  let rootImages: ReturnType<typeof imageWithInstanceToDisplay>[] = [];

  const result = await getFolderImages(db, gallery.folderId, {
    page: 1,
    limit: 500,
  });
  rootImages = result.images.map((imgData) =>
    imageWithInstanceToDisplay(imgData)
  );

  return {
    requiresAccess: false,
    id: gallery.id,
    name: gallery.name,
    slug: gallery.slug,
    client_name: gallery.clientName,
    shoot_date: gallery.shootDate,
    sub_folders: [],
    images: rootImages,
  };
});
