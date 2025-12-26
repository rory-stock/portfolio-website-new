import type { ImageBase, ImageGroupProxy } from "~~/types/imageTypes";

/**
 * Group images by layout_group_id for admin UI
 * Returns an array of group PROXIES and individual images in display order
 * Proxies don't contain nested arrays - prevents vueDraggable issues
 */
export function organizeImagesForAdmin(
  images: ImageBase[]
): (ImageBase | ImageGroupProxy)[] {
  const result: (ImageBase | ImageGroupProxy)[] = [];
  const processedGroups = new Set<number>();

  for (const image of images) {
    // If the image is in a group
    if (image.layout_group_id !== null) {
      // Skip if we already processed this group
      if (processedGroups.has(image.layout_group_id)) {
        continue;
      }

      // Create a lightweight PROXY - no nested images array
      const groupProxy: ImageGroupProxy = {
        type: "group-proxy",
        group_id: image.layout_group_id,
        layout_type: image.layout_type!,
        display_order: image.group_display_order ?? 0,
      };

      result.push(groupProxy);
      processedGroups.add(image.layout_group_id);
    } else {
      // Individual image
      result.push(image);
    }
  }

  return result;
}

/**
 * Get all images belonging to a specific group
 */
export function getGroupMembers(
  images: ImageBase[],
  groupId: number
): ImageBase[] {
  return images
    .filter((img) => img.layout_group_id === groupId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Check if the item is an ImageGroupProxy
 */
export function isImageGroupProxy(
  item: ImageBase | ImageGroupProxy
): item is ImageGroupProxy {
  return "type" in item && item.type === "group-proxy";
}

/**
 * Flatten groups back to individual images for API submission
 */
export function flattenImagesForApi(
  items: (ImageBase | ImageGroupProxy)[],
  allImages: ImageBase[]
): number[] {
  const imageIds: number[] = [];

  for (const item of items) {
    if (isImageGroupProxy(item)) {
      // Get group members from the source images array
      const groupMembers = getGroupMembers(allImages, item.group_id);
      imageIds.push(...groupMembers.map((img) => img.id));
    } else {
      // Individual image
      imageIds.push(item.id);
    }
  }

  return imageIds;
}
