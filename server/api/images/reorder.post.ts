import { eq, and } from "drizzle-orm";

import { images } from "~~/server/db/schema";
import { useDB } from "~~/server/db/client";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const db = useDB(event);
  const body = await readBody(event);

  const { context, order } = body as {
    context: string;
    order: number[]; // Array of image IDs in desired order
  };

  if (!context || !order || !Array.isArray(order)) {
    throw createError({
      statusCode: 400,
      message: "context and order array required",
    });
  }

  // Update order for each image
  for (let i = 0; i < order.length; i++) {
    await db
      .update(images)
      .set({ order: i })
      .where(and(eq(images.id, order[i]), eq(images.context, context)));
  }

  // Get updated images
  const updatedImages = await db
    .select()
    .from(images)
    .where(eq(images.context, context))
    .orderBy(images.order);

  return {
    success: true,
    images: updatedImages,
  };
});
