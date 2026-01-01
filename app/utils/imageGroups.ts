import type { ImageBase, ImageGroup } from "~~/types/imageTypes";
import { isValidLayoutType, type LayoutTypeId } from "~/utils/layouts";

/**
 * Group images by layout_group_id for admin UI
 * Returns an array of groups and individual images in display order
 */
export function organizeImagesForAdmin(
  images: ImageBase[]
): (ImageBase | ImageGroup)[] {
  const result: (ImageBase | ImageGroup)[] = [];
  const processedGroups = new Set<number>();

  for (const image of images) {
    // If the image is in a group
    if (image.layout_group_id !== null) {
      // Skip if we already processed this group
      if (processedGroups.has(image.layout_group_id)) {
        continue;
      }

      // Find all images in this group
      const groupImages = images.filter(
        (img) => img.layout_group_id === image.layout_group_id
      );

      // Validate layout_type
      const layoutType: LayoutTypeId =
        image.layout_type && isValidLayoutType(image.layout_type)
          ? image.layout_type
          : (() => {
              throw new Error(`Invalid layout_type: ${image.layout_type}`);
            })();

      // Create the group object with the images array
      const group: ImageGroup = {
        group_id: image.layout_group_id,
        layout_type: layoutType,
        images: groupImages,
        display_order: image.group_display_order ?? 0,
      };

      result.push(group);
      processedGroups.add(image.layout_group_id);
    } else {
      // Individual image
      result.push(image);
    }
  }

  return result;
}

/**
 * Check if the item is an ImageGroup
 */
export function isImageGroup(item: ImageBase | ImageGroup): item is ImageGroup {
  return "group_id" in item && "images" in item;
}

/**
 * Flatten groups back to individual images for API submission
 */
export function flattenImagesForApi(
  items: (ImageBase | ImageGroup)[]
): number[] {
  const imageIds: number[] = [];

  for (const item of items) {
    if (isImageGroup(item)) {
      // Add all group member IDs in their current order
      imageIds.push(...item.images.map((img) => img.id));
    } else {
      // Individual image
      imageIds.push(item.id);
    }
  }

  return imageIds;
}
