import type { DisplayImage, ImageWithInstance } from "~~/types/imageTypes";
import type { LayoutTypeId } from "~/utils/layouts";
import { isValidLayoutType } from "~/utils/layouts";
import type {
  BaseImage,
  ImageInstance,
  ImageMetadata,
  ImageLayout,
} from "~~/types/database";

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
    file_size: base.fileSize,
    original_filename: base.originalFilename,
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
  imageDataArray: (ImageWithInstance & { layoutGroup?: any })[]
): DisplayImage[] {
  return imageDataArray.map((imageData) => {
    const layoutGroupData = imageData.layoutGroup
      ? {
          layoutType: imageData.layoutGroup.layoutType,
          groupDisplayOrder: imageData.layoutGroup.groupDisplayOrder,
        }
      : null;

    return imageWithInstanceToDisplay(imageData, layoutGroupData);
  });
}
