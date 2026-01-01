/**
 * Layout system types
 */
export interface LayoutType {
  id: string;
  label: string;
  imageCount: number;
  description: string;
}

export type LayoutTypeId =
  | "fullscreen-hero"
  | "single-hero"
  | "dual-horizontal"
  | "triple-row"
  | "asymmetric-left"
  | "asymmetric-right";
