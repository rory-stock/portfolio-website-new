// server/api/images/[id].get.ts
import { eq } from "drizzle-orm";

import { images } from "~~/server/db/schema";
import { useDB } from "~~/server/db/client";
import type { ImageBase } from "~~/types/imageTypes";

export default defineEventHandler(async (event): Promise<{ image: ImageBase }> => {
  const db = useDB(event);
  const id = Number(getRouterParam(event, "id"));
  const session = await getUserSession(event);

  const [image] = await db.select().from(images).where(eq(images.id, id));

  if (!image) {
    throw createError({ statusCode: 404, message: "Image not found" });
  }

  if (!image.is_public && !session?.user) {
    throw createError({ statusCode: 403, message: "Forbidden" });
  }

  return { image };
});
