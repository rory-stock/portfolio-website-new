import { resolveGallery } from "~~/server/utils/resolveGallery";
import { deleteGallery } from "~~/server/utils/mutations/galleries";

export default defineEventHandler(async (event) => {
  const { db, gallery } = await resolveGallery(event);

  await deleteGallery(db, gallery.id);

  return { success: true };
});
