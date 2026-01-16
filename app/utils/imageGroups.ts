import type { DisplayImage, ImageGroup } from "~~/types/imageTypes";
import { isValidLayoutType, type LayoutTypeId } from "~/utils/layouts";

/**
 * Group images by layout_group_id for admin UI
 * Returns an array of groups and individual images in display order
 */
export function organizeImagesForAdmin(
  images: DisplayImage[]
): (DisplayImage | ImageGroup)[] {
  const result: (DisplayImage | ImageGroup)[] = [];
  const processedGroups = new Set<number>();

  for (const image of images) {
    // If the image is in a group
    if (image.layout_group_id !== null && image.layout_group_id !== undefined) {
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
        group_id: image.layout_group_id, // TypeScript now knows this is not undefined
        layout_type: layoutType,
        images: groupImages as any, // Cast to ImageBase for compatibility
        display_order: image.group_display_order ?? 0,
      };

      result.push(group);
      processedGroups.add(image.layout_group_id);
    } else {
      // Individual image
      result.push(image as any); // Cast to ImageBase for compatibility
    }
  }

  return result;
}

/**
 * Check if the item is an ImageGroup
 */
export function isImageGroup(
  item: DisplayImage | ImageGroup
): item is ImageGroup {
  return "group_id" in item && "images" in item;
}

/**
 * Check if the item is in a fullscreen or single hero layout
 */
export function isImageHero(item: DisplayImage | ImageGroup): boolean {
  return (
    item.layout_type === "fullscreen-hero" || item.layout_type === "single-hero"
  );
}

/**
 * Check hero type
 */
export function getHeroType(
  item: DisplayImage | ImageGroup
): LayoutTypeId | null {
  if (
    item.layout_type === "fullscreen-hero" ||
    item.layout_type === "single-hero"
  ) {
    return item.layout_type;
  }
  return null;
}

/**
 * Flatten groups back to individual images for API submission
 * Returns instance IDs
 */
export function flattenImagesForApi(
  items: (DisplayImage | ImageGroup)[]
): number[] {
  const instanceIds: number[] = [];

  for (const item of items) {
    if (isImageGroup(item)) {
      // Add all group member instance IDs in their current order
      instanceIds.push(...item.images.map((img: any) => img.instanceId));
    } else {
      // Individual image - use instanceId
      instanceIds.push((item as any).instanceId);
    }
  }

  return instanceIds;
}
