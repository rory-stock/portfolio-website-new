import { resolveGallery } from "~~/server/utils/resolveGallery";
import { galleryToResponse } from "~~/server/utils/galleryTransform";

export default defineEventHandler(async (event) => {
  const { gallery } = await resolveGallery(event);

  return galleryToResponse(gallery);
});
