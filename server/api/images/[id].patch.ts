import { eq } from "drizzle-orm";
import * as schema from "~~/server/db/schema";
import { useDB } from "~~/server/db/client";
import { VALID_CONTEXTS, isValidContext } from "~/utils/context";
import { requireAuth } from "~~/server/utils/requireAuth";
import type { ImageUpdateRequest, ImageUpdateResponse } from "~~/types/api";
import {
  getImageWithInstance,
  getImagesByR2Path,
} from "~~/server/utils/queries";
import { imageWithInstanceToDisplay } from "~~/server/utils/imageTransform";
import { createImageInstanceRecord } from "~~/server/utils/mutations";
import { deleteImageInstance } from "~~/server/utils/mutations";
import { deleteR2Object } from "~/utils/r2";

export default defineEventHandler(
  async (event): Promise<ImageUpdateResponse> => {
    await requireAuth(event);

    const db = useDB(event);
    const id = Number(getRouterParam(event, "id")); // This is instanceId
    const body = await readBody<ImageUpdateRequest>(event);

    if (!id || isNaN(id)) {
      throw createError({ statusCode: 400, message: "Invalid image ID" });
    }

    // Validate contexts if provided
    if (body.add_contexts?.some((c) => !isValidContext(c))) {
      throw createError({
        statusCode: 400,
        message: `Invalid context value. Must be one of: ${VALID_CONTEXTS.join(", ")}`,
      });
    }

    // Get current image data
    const currentData = await getImageWithInstance(db, id);

    if (!currentData) {
      throw createError({ statusCode: 404, message: "Image not found" });
    }

    // Handle layout removal
    if (body.remove_layout === true) {
      const [layout] = await db
        .select()
        .from(schema.imageLayouts)
        .where(eq(schema.imageLayouts.imageInstanceId, id))
        .limit(1);

      if (layout && layout.layoutGroupId) {
        // Get all images in this layout group
        const groupLayouts = await db
          .select()
          .from(schema.imageLayouts)
          .where(eq(schema.imageLayouts.layoutGroupId, layout.layoutGroupId));

        // Delete all image_layouts for this group
        await db
          .delete(schema.imageLayouts)
          .where(eq(schema.imageLayouts.layoutGroupId, layout.layoutGroupId));

        // Delete the layout_group
        await db
          .delete(schema.layoutGroups)
          .where(eq(schema.layoutGroups.id, layout.layoutGroupId));
      } else {
        // Single image layout
        await db
          .delete(schema.imageLayouts)
          .where(eq(schema.imageLayouts.imageInstanceId, id));
      }

      // Get updated data
      const updatedData = await getImageWithInstance(db, id);
      if (!updatedData) {
        throw createError({ statusCode: 404, message: "Image not found" });
      }

      return {
        success: true,
        image: imageWithInstanceToDisplay(updatedData),
        layout_removed: true,
      };
    }

    // Update alt text (applies to base image - all contexts)
    if (body.alt !== undefined) {
      await db
        .update(schema.baseImages)
        .set({
          alt: body.alt,
          updatedAt: new Date(),
        })
        .where(eq(schema.baseImages.id, currentData.base.id));
    }

    // Update description (applies to this instance's metadata)
    if (body.description !== undefined) {
      if (currentData.metadata) {
        // Update existing metadata
        await db
          .update(schema.imageMetadata)
          .set({
            description: body.description,
            updatedAt: new Date(),
          })
          .where(eq(schema.imageMetadata.imageInstanceId, id));
      } else {
        // Create new metadata
        await db.insert(schema.imageMetadata).values({
          imageInstanceId: id,
          description: body.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Update instance-specific fields
    const instanceUpdates: any = { updatedAt: new Date() };

    if (body.is_public !== undefined) {
      instanceUpdates.isPublic = body.is_public;
    }

    if (body.is_primary !== undefined) {
      // If setting as primary, unset others in this context
      if (body.is_primary === true) {
        await db
          .update(schema.imageInstances)
          .set({ isPrimary: false })
          .where(
            eq(
              schema.imageInstances.context,
              currentData.instance.context as any
            )
          );
      }
      instanceUpdates.isPrimary = body.is_primary;
    }

    // Apply instance updates if any
    if (Object.keys(instanceUpdates).length > 1) {
      await db
        .update(schema.imageInstances)
        .set(instanceUpdates)
        .where(eq(schema.imageInstances.id, id));
    }

    // Handle remove_contexts
    if (body.remove_contexts && body.remove_contexts.length > 0) {
      const allContextsData = await getImagesByR2Path(
        db,
        currentData.base.r2Path
      );

      if (!allContextsData) {
        throw createError({ statusCode: 404, message: "Image not found" });
      }

      const remainingContexts = allContextsData.instances.filter(
        (inst) => !body.remove_contexts!.includes(inst.context)
      );

      if (remainingContexts.length === 0) {
        throw createError({
          statusCode: 400,
          message: "Cannot remove all contexts. Use DELETE endpoint instead.",
        });
      }

      // Delete specified context instances
      for (const context of body.remove_contexts) {
        const instanceToDelete = allContextsData.instances.find(
          (inst) => inst.context === context
        );

        if (instanceToDelete) {
          const result = await deleteImageInstance(db, instanceToDelete.id);

          // If this was the last instance, also delete from R2
          if (result.deletedBaseImage && result.r2Path) {
            await deleteR2Object(result.r2Path);
          }
        }
      }
    }

    // Handle add_contexts
    if (body.add_contexts && body.add_contexts.length > 0) {
      const allContextsData = await getImagesByR2Path(
        db,
        currentData.base.r2Path
      );

      if (!allContextsData) {
        throw createError({ statusCode: 404, message: "Image not found" });
      }

      const existingContexts = allContextsData.instances.map(
        (inst) => inst.context
      );
      const newContexts = body.add_contexts.filter(
        (c) => !existingContexts.includes(c as any)
      );

      // Create new instances for each new context
      for (const context of newContexts) {
        await createImageInstanceRecord(db, currentData.base.id, context, {
          isPublic: currentData.instance.isPublic,
          isPrimary: false,
        });
      }
    }

    // Get updated data
    const updatedData = await getImageWithInstance(db, id);

    if (!updatedData) {
      throw createError({ statusCode: 404, message: "Image not found" });
    }

    // Get all contexts if contexts were modified
    let allContexts = undefined;
    if (body.add_contexts || body.remove_contexts) {
      const allContextsData = await getImagesByR2Path(
        db,
        currentData.base.r2Path
      );
      if (allContextsData) {
        allContexts = allContextsData.instances.map((inst) =>
          imageWithInstanceToDisplay({
            base: allContextsData.base,
            instance: inst,
            metadata: null,
            layout: null,
          })
        );
      }
    }

    return {
      success: true,
      image: imageWithInstanceToDisplay(updatedData),
      all_contexts: allContexts,
    };
  }
);
