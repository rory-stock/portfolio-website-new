import { eq, and, ne } from "drizzle-orm";

import { images } from "~~/server/db/schema";
import { useDB } from "~~/server/db/client";
import { VALID_CONTEXTS, isValidContext } from "~/utils/context";
import {
  validateImageUpdate,
  IMAGE_FIELD_CONFIGS,
  isUpdatableField,
  createContextRecord,
  type ImageUpdateBody,
} from "~/utils/imageFields";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const db = useDB(event);
  const id = Number(getRouterParam(event, "id"));
  const body = await readBody<ImageUpdateBody>(event);

  // Centralized validation
  const validation = validateImageUpdate(body);
  if (!validation.valid) {
    throw createError({ statusCode: 400, message: validation.error });
  }

  // Validate contexts if provided
  if (body.add_contexts?.some((c) => !isValidContext(c))) {
    throw createError({
      statusCode: 400,
      message: `Invalid context value. Must be one of: ${VALID_CONTEXTS.join(", ")}`,
    });
  }

  // Handle layout removal (before other field updates)
  if (body.remove_layout === true) {
    // Get the current image to check group status
    const [currentImage] = await db
      .select()
      .from(images)
      .where(eq(images.id, id));

    if (!currentImage) {
      throw createError({ statusCode: 404, message: "Image not found" });
    }

    const wasGrouped = currentImage.layout_group_id !== null;

    // If the image is in a group, remove the layout from the entire group
    if (
      wasGrouped &&
      currentImage.layout_group_id !== null &&
      currentImage.layout_type !== null
    ) {
      await db
        .update(images)
        .set({
          layout_type: null,
          layout_group_id: null,
          group_display_order: null,
        })
        .where(eq(images.layout_group_id, currentImage.layout_group_id));
    } else {
      // Single image layout, just clear its layout
      await db
        .update(images)
        .set({
          layout_type: null,
          layout_group_id: null,
          group_display_order: null,
        })
        .where(eq(images.id, id));
    }

    // Return early after layout removal
    const [updatedImage] = await db
      .select()
      .from(images)
      .where(eq(images.id, id));

    return {
      success: true,
      image: updatedImage,
      layout_removed: true,
      group_was_removed: wasGrouped, // Frontend uses this to trigger refetching
    };
  }

  // Get current image
  const [currentImage] = await db
    .select()
    .from(images)
    .where(eq(images.id, id));

  if (!currentImage) {
    throw createError({ statusCode: 404, message: "Image not found" });
  }

  // Apply field updates based on centralized scope configuration
  for (const [field, value] of Object.entries(body)) {
    // Skip undefined values and context operations
    if (
      value === undefined ||
      field === "add_contexts" ||
      field === "remove_contexts"
    ) {
      continue;
    }

    // Skip non-updatable fields
    if (!isUpdatableField(field)) {
      continue;
    }

    const config = IMAGE_FIELD_CONFIGS[field];

    switch (config.scope) {
      case "all_r2_path":
        // Update all records with the same r2_path (e.g., alt, description)
        await db
          .update(images)
          .set({ [field]: value })
          .where(eq(images.r2_path, currentImage.r2_path));
        break;

      case "context_scoped":
        // Special handling for is_primary
        if (field === "is_primary" && value === true) {
          // Unset all other primaries in this context
          await db
            .update(images)
            .set({ is_primary: false })
            .where(eq(images.context, currentImage.context));
        }
        // Update the specific record
        await db
          .update(images)
          .set({ [field]: value })
          .where(eq(images.id, id));
        break;

      case "single_record":
        // Update only this specific record (e.g. is_public)
        await db
          .update(images)
          .set({ [field]: value })
          .where(eq(images.id, id));
        break;
    }
  }

  // Handle remove_contexts
  if (body.remove_contexts && body.remove_contexts.length > 0) {
    // Get all records with the same r2_path
    const allRecords = await db
      .select()
      .from(images)
      .where(eq(images.r2_path, currentImage.r2_path));

    // Check if removing all contexts
    const remainingContexts = allRecords.filter(
      (r) => !body.remove_contexts!.includes(r.context)
    );

    if (remainingContexts.length === 0) {
      throw createError({
        statusCode: 400,
        message: "Cannot remove all contexts. Use DELETE endpoint instead.",
      });
    }

    // Delete specified context records
    for (const context of body.remove_contexts) {
      const recordsToDelete = allRecords.filter((r) => r.context === context);
      for (const record of recordsToDelete) {
        await db.delete(images).where(eq(images.id, record.id));
      }
    }
  }

  // Handle add_contexts
  if (body.add_contexts && body.add_contexts.length > 0) {
    // Check which contexts already exist
    const existingRecords = await db
      .select()
      .from(images)
      .where(eq(images.r2_path, currentImage.r2_path));

    const existingContexts = existingRecords.map((r) => r.context);
    const newContexts = body.add_contexts.filter(
      (c) => !existingContexts.includes(c)
    );

    // Create new records for each new context using helper
    for (const context of newContexts) {
      await db
        .insert(images)
        .values(createContextRecord(currentImage, context))
        .returning();
    }
  }

  // Get updated record
  const [updatedImage] = await db
    .select()
    .from(images)
    .where(eq(images.id, id));

  // Get all contexts if contexts were modified
  let allContexts = undefined;
  if (body.add_contexts || body.remove_contexts) {
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
