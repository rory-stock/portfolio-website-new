import { useDB } from "~~/server/db/client";
import { requireAuth } from "~~/server/utils/requireAuth";
import { getAllGalleries } from "~~/server/utils/queries/galleries";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const db = useDB(event);
  const galleries = await getAllGalleries(db);

  return {
    galleries,
    total: galleries.length,
  };
});
