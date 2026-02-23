import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import { getFolderWithCover } from "~~/server/utils/queries/folders";
import { imageWithInstanceToDisplay } from "~~/server/utils/imageTransform";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const db = useDB(event);
  const id = Number(getRouterParam(event, "id"));

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: "Invalid folder ID" });
  }

  const result = await getFolderWithCover(db, id);

  if (!result) {
    throw createError({ statusCode: 404, message: "Folder not found" });
  }

  const { folder, coverImage } = result;

  return {
    folder: {
      id: folder.id,
      name: folder.name,
      slug: folder.slug,
      parent_folder_id: folder.parentFolderId,
      folder_type: folder.folderType,
      is_public: folder.isPublic,
      image_count: folder.imageCount,
      cover_image: coverImage
        ? imageWithInstanceToDisplay({
            base: coverImage.base,
            instance: coverImage.instance,
            metadata: null,
            layout: null,
          })
        : null,
      created_at: folder.createdAt,
      updated_at: folder.updatedAt,
    },
  };
});
