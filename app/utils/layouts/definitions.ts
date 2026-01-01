/**
 * Layout configurations
 */
import type { LayoutType, LayoutTypeId } from "./types";

export const LAYOUT_TYPES: Record<LayoutTypeId, LayoutType> = {
  "fullscreen-hero": {
    id: "fullscreen-hero",
    label: "Fullscreen Hero",
    imageCount: 1,
    description: "Full viewport coverage",
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
