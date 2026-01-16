import { useDB } from "~~/server/db/client";
import { getImageWithInstance } from "~~/server/utils/queries";
import { imageWithInstanceToDisplay } from "~~/server/utils/imageTransform";
import type { DisplayImage } from "~~/types/imageTypes";

export default defineEventHandler(
  async (event): Promise<{ image: DisplayImage }> => {
    const db = useDB(event);
    const id = Number(getRouterParam(event, "id"));
    const session = await getUserSession(event);

    if (!id || isNaN(id)) {
      throw createError({ statusCode: 400, message: "Invalid image ID" });
    }

    const imageData = await getImageWithInstance(db, id);

    if (!imageData) {
      throw createError({ statusCode: 404, message: "Image not found" });
    }

    // Check auth for non-public
    if (!imageData.instance.isPublic && !session?.user) {
      throw createError({ statusCode: 403, message: "Forbidden" });
    }

    const displayImage = imageWithInstanceToDisplay(imageData);

    return { image: displayImage };
  }
);
