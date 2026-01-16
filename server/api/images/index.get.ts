import { useDB } from "~~/server/db/client";
import type { ImageListResponse } from "~~/types/api";
import {
  getImagesForContext,
  getPrimaryImageForContext,
} from "~~/server/utils/queries";
import {
  imageWithInstanceArrayToDisplay,
  imageWithInstanceToDisplay,
} from "~~/server/utils/imageTransform";
import { isValidContext } from "~/utils/context";

export default defineEventHandler(async (event): Promise<ImageListResponse> => {
  const db = useDB(event);
  const query = getQuery(event);
  const session = await getUserSession(event);

  // Parse query params
  const context = query.context as string | undefined;
  const isPrimary = query.is_primary === "true";
  const r2Path = query.r2_path as string | undefined;
  const includeLayouts = query.include_layouts === "true";

  // Validate context if provided
  if (context && !isValidContext(context)) {
    throw createError({
      statusCode: 400,
      message: "Invalid context",
    });
  }

  // Handle primary image request
  if (isPrimary && context) {
    const primaryData = await getPrimaryImageForContext(db, context);

    if (!primaryData) {
      return { images: [], total: 0 };
    }

    // Check auth for non-public
    if (!primaryData.instance.isPublic && !session?.user) {
      throw createError({ statusCode: 403, message: "Forbidden" });
    }

    const displayImage = imageWithInstanceToDisplay({
      base: primaryData.base,
      instance: primaryData.instance,
      metadata: null,
      layout: null,
    });

    return {
      images: [displayImage],
      total: 1,
    };
  }

  // Handle r2_path request (get all contexts for an image)
  if (r2Path) {
    const { getImagesByR2Path } = await import("~~/server/utils/queries");
    const result = await getImagesByR2Path(db, r2Path);

    if (!result) {
      return { images: [], total: 0 };
    }

    // Convert instances to the display format
    const displayImages = result.instances.map((instance) =>
      imageWithInstanceToDisplay({
        base: result.base,
        instance,
        metadata: null,
        layout: null,
      })
    );

    // Filter by auth if needed
    const filteredImages = displayImages.filter((img) => {
      return img.is_public || session?.user;
    });

    return {
      images: filteredImages,
      total: filteredImages.length,
    };
  }

  // Handle context-based listing
  if (!context) {
    throw createError({
      statusCode: 400,
      message: "context or r2_path required",
    });
  }

  const imagesData = await getImagesForContext(db, context, {
    isPublic: !session?.user ? true : undefined,
    includeLayouts,
  });

  const displayImages = imageWithInstanceArrayToDisplay(imagesData);

  return {
    images: displayImages,
    total: displayImages.length,
  };
});
