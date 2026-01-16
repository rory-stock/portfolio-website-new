import type { ImageBase } from "~~/types/imageTypes";
import type { DisplayImage, ImageWithInstance } from "~~/types/imageTypes";
import type { LayoutTypeId } from "~/utils/layouts";
import { isValidLayoutType } from "~/utils/layouts";
import type { InferSelectModel } from "drizzle-orm";
import type { images } from "~~/server/db/schema";
import type {
  BaseImage,
  ImageInstance,
  ImageMetadata,
  ImageLayout,
} from "~~/types/database";

type DbImage = InferSelectModel<typeof images>;

/**
 * Transform database image record to ImageBase type (LEGACY - for old schema)
 * Validates layout_type and ensures type safety
 */
export function toImageBase(dbImage: DbImage): ImageBase {
  const layout_type: LayoutTypeId | null =
    dbImage.layout_type && isValidLayoutType(dbImage.layout_type)
      ? dbImage.layout_type
      : null;

  return {
    ...dbImage,
    layout_type,
  };
}

/**
 * Transform an array of database image records to ImageBase types (LEGACY)
 */
export function toImageBaseArray(dbImages: DbImage[]): ImageBase[] {
  return dbImages.map(toImageBase);
}

/**
 * Transform new schema data (base + instance + metadata + layout) to DisplayImage
 * This is the primary transform for the new schema
 */
export function toDisplayImage(
  base: BaseImage,
  instance: ImageInstance,
  metadata?: ImageMetadata | null,
  layout?: ImageLayout | null,
  layoutGroup?: { layoutType: string; groupDisplayOrder: number } | null
): DisplayImage {
  // Determine layout info
  let layoutType: LayoutTypeId | null = null;
  let layoutGroupId: number | null = null;
  let groupDisplayOrder: number | null = null;

  if (layout && layoutGroup) {
    layoutType = isValidLayoutType(layoutGroup.layoutType)
      ? layoutGroup.layoutType
      : null;
    layoutGroupId = layout.layoutGroupId;
    groupDisplayOrder = layoutGroup.groupDisplayOrder;
  }

  return {
    id: base.id,
    instanceId: instance.id,
    context: instance.context,
    r2_path: base.r2Path,
    url: base.url,
    alt: base.alt,
    description: metadata?.description || null,
    width: base.width,
    height: base.height,
    is_public: instance.isPublic,
    is_primary: instance.isPrimary,
    order: instance.order,
    layout_type: layoutType,
    layout_group_id: layoutGroupId,
    group_display_order: groupDisplayOrder,
    captured_at: base.capturedAt || null,
    created_at: instance.createdAt,
    updated_at: instance.updatedAt,
  };
}

/**
 * Transform ImageWithInstance to DisplayImage
 */
export function imageWithInstanceToDisplay(
  imageData: ImageWithInstance,
  layoutGroup?: { layoutType: string; groupDisplayOrder: number } | null
): DisplayImage {
  return toDisplayImage(
    imageData.base,
    imageData.instance,
    imageData.metadata,
    imageData.layout,
    layoutGroup
  );
}

/**
 * Transform array of ImageWithInstance to DisplayImage array
 */
export function imageWithInstanceArrayToDisplay(
  imageDataArray: ImageWithInstance[]
): DisplayImage[] {
  return imageDataArray.map((imageData) =>
    imageWithInstanceToDisplay(imageData)
  );
}
