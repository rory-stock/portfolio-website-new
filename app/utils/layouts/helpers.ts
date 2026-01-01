import type { SnapSection, SnapImage } from "~~/types/imageTypes";
import { LAYOUT_TYPES } from "~/utils/layouts/definitions";
import type { LayoutTypeId } from "~/utils/layouts/types";

/**
 * Helper to group consecutive images by layout type
 */
export function groupImagesByLayout(images: SnapImage[]): SnapSection[] {
  const sections: SnapSection[] = [];
  let currentGroup: SnapImage[] = [];
  let currentLayoutType: LayoutTypeId | null = null;

  for (const image of images) {
    const layoutType: LayoutTypeId | null =
      image.layout_type && isValidLayoutType(image.layout_type)
        ? image.layout_type
        : null;

    if (layoutType === null) {
      if (currentGroup.length > 0) {
        sections.push({
          layoutType: currentLayoutType,
          images: currentGroup,
        });
        currentGroup = [];
      }
      sections.push({
        layoutType: null,
        images: [image],
      });
      currentLayoutType = null;
    } else if (layoutType !== currentLayoutType) {
      if (currentGroup.length > 0) {
        sections.push({
          layoutType: currentLayoutType,
          images: currentGroup,
        });
      }
      currentGroup = [image];
      currentLayoutType = layoutType;
    } else {
      currentGroup.push(image);
    }
  }

  if (currentGroup.length > 0) {
    sections.push({
      layoutType: currentLayoutType,
      images: currentGroup,
    });
  }

  return sections;
}

export function isValidLayoutType(type: string): type is LayoutTypeId {
  return type in LAYOUT_TYPES;
}
