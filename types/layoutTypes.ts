import type { SnapSection, SnapImage } from "~~/types/imageTypes";

export interface LayoutType {
  id: string;
  label: string;
  imageCount: number;
  description: string;
}

export const LAYOUT_TYPES: Record<string, LayoutType> = {
  "fullscreen-hero": {
    id: "fullscreen-hero",
    label: "Fullscreen Hero",
    imageCount: 1,
    description: "Full viewport coverage (fills entire screen below header)",
  },
  "single-hero": {
    id: "single-hero",
    label: "Single Hero",
    imageCount: 1,
    description: "One large centered image",
  },
  "dual-horizontal": {
    id: "dual-horizontal",
    label: "Dual Horizontal",
    imageCount: 2,
    description: "Two images side by side",
  },
  "triple-row": {
    id: "triple-row",
    label: "Triple Row",
    imageCount: 3,
    description: "Three images in a row",
  },
  "asymmetric-left": {
    id: "asymmetric-left",
    label: "Asymmetric Left",
    imageCount: 2,
    description: "Large left, small right",
  },
  "asymmetric-right": {
    id: "asymmetric-right",
    label: "Asymmetric Right",
    imageCount: 2,
    description: "Large right, small left",
  },
};

export type LayoutTypeId = keyof typeof LAYOUT_TYPES;

// Helper to group consecutive images by layout type
export function groupImagesByLayout(images: SnapImage[]): SnapSection[] {
  const sections: SnapSection[] = [];
  let currentGroup: SnapImage[] = [];
  let currentLayoutType: string | null = null;

  for (const image of images) {
    // Normalize empty string to null
    const layoutType = image.layout_type === "" ? null : image.layout_type;

    // If layout_type is null, create individual sections (don't group)
    if (layoutType === null) {
      // Push any existing group first
      if (currentGroup.length > 0) {
        sections.push({
          layoutType: currentLayoutType,
          images: currentGroup,
        });
        currentGroup = [];
      }
      // Add this null-layout image as its own section
      sections.push({
        layoutType: null,
        images: [image],
      });
      currentLayoutType = null;
    } else if (layoutType !== currentLayoutType) {
      // Layout type changed - push existing group and start new one
      if (currentGroup.length > 0) {
        sections.push({
          layoutType: currentLayoutType,
          images: currentGroup,
        });
      }
      currentGroup = [image];
      currentLayoutType = layoutType;
    } else {
      // Same layout type - add to the current group
      currentGroup.push(image);
    }
  }

  // Push any remaining group
  if (currentGroup.length > 0) {
    sections.push({
      layoutType: currentLayoutType,
      images: currentGroup,
    });
  }

  return sections;
}
