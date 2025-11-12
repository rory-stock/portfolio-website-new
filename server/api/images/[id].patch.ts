import { eq } from "drizzle-orm";

import { images } from "~~/server/db/schema";
import { useDB } from "~~/server/db/client";
import { VALID_CONTEXTS, isValidContext } from "~~/server/utils/context";

export default defineEventHandler(async (event) => {
  // Auth required
  const { user } = await requireUserSession(event);
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const db = useDB(event);
  const id = Number(getRouterParam(event, "id"));
  const body = await readBody(event);

  // Validate body
  const { alt, is_primary, is_public, add_contexts, remove_contexts } =
    body as {
      alt?: string;
      is_primary?: boolean;
      is_public?: boolean;
      add_contexts?: string[];
      remove_contexts?: string[];
    };

  // Validation
  if (add_contexts && remove_contexts) {
    const overlap = add_contexts.filter((c) => remove_contexts.includes(c));
    if (overlap.length > 0) {
      throw createError({
        statusCode: 400,
        message: "Cannot add and remove same context",
      });
    }
  }

  if (alt && alt.length > 500) {
    throw createError({
      statusCode: 400,
      message: "Alt text max 500 characters",
    });
  }

  if (add_contexts?.some((c) => !isValidContext(c))) {
    throw createError({
      statusCode: 400,
      message: `Invalid context value. Must be one of: ${VALID_CONTEXTS.join(", ")}`,
    });
  }

  // Get current image
  const [currentImage] = await db
    .select()
    .from(images)
    .where(eq(images.id, id));

  if (!currentImage) {
    throw createError({ statusCode: 404, message: "Image not found" });
  }

  // Handle alt text update (applies to all contexts with same r2_path)
  if (alt !== undefined) {
    await db
      .update(images)
      .set({ alt })
      .where(eq(images.r2_path, currentImage.r2_path));
  }

  // Handle is_primary toggle
  if (is_primary !== undefined) {
    if (is_primary) {
      // Unset all other primaries in this context
      await db
        .update(images)
        .set({ is_primary: false })
        .where(eq(images.context, currentImage.context));
    }

    // Set this image's primary status
    await db.update(images).set({ is_primary }).where(eq(images.id, id));
  }

  // Handle is_public toggle
  if (is_public !== undefined) {
    await db.update(images).set({ is_public }).where(eq(images.id, id));
  }

  // Handle remove_contexts
  if (remove_contexts && remove_contexts.length > 0) {
    // Get all records with same r2_path
    const allRecords = await db
      .select()
      .from(images)
      .where(eq(images.r2_path, currentImage.r2_path));

    // Check if removing all contexts
    const remainingContexts = allRecords.filter(
      (r) => !remove_contexts.includes(r.context)
    );

    if (remainingContexts.length === 0) {
      throw createError({
        statusCode: 400,
        message: "Cannot remove all contexts. Use DELETE endpoint instead.",
      });
    }

    // Delete specified context records
    for (const context of remove_contexts) {
      const recordsToDelete = allRecords.filter((r) => r.context === context);
      for (const record of recordsToDelete) {
        await db.delete(images).where(eq(images.id, record.id));
      }
    }
  }

  // Handle add_contexts
  let addedRecords = [];
  if (add_contexts && add_contexts.length > 0) {
    // Check which contexts already exist
    const existingRecords = await db
      .select()
      .from(images)
      .where(eq(images.r2_path, currentImage.r2_path));

    const existingContexts = existingRecords.map((r) => r.context);
    const newContexts = add_contexts.filter(
      (c) => !existingContexts.includes(c)
    );

    // Create new records for each new context
    for (const context of newContexts) {
      const [newRecord] = await db
        .insert(images)
        .values({
          context,
          r2_path: currentImage.r2_path,
          url: currentImage.url,
          alt: currentImage.alt,
          width: currentImage.width,
          height: currentImage.height,
          file_size: currentImage.file_size,
          original_filename: currentImage.original_filename,
          is_primary: false,
          uploaded_at: new Date(),
        })
        .returning();

      addedRecords.push(newRecord);
    }
  }

  // Get updated record
  const [updatedImage] = await db
    .select()
    .from(images)
    .where(eq(images.id, id));

  // Get all contexts if contexts were modified
  let allContexts = undefined;
  if (add_contexts || remove_contexts) {
    allContexts = await db
      .select()
      .from(images)
      .where(eq(images.r2_path, currentImage.r2_path));
  }

  return {
    success: true,
    image: updatedImage,
    all_contexts: allContexts,
  };
});
