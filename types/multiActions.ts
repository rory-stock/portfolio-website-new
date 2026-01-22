import type { IconName } from "../app/components/icons/iconData";
import type { DisplayImage } from "./imageTypes";

export interface MultiAction {
  id: string;
  label: string; // Present continuous format for toast (e.g. "Deleting", "Toggling visibility")
  icon: IconName;
  variant?: "primary" | "secondary" | "danger";
  needsConfirmation: boolean;
  breaksLayouts: boolean; // Auto-adds layout warnings if true
  delay?: number; // Custom delay in ms (optional, defaults to 8000)

  // Optional custom warnings (in addition to layout warnings)
  getWarnings?: (selectedImages: DisplayImage[]) => string[];

  // Confirmation modal content (only used if needsConfirmation: true)
  getConfirmation?: (selectedImages: DisplayImage[]) => {
    title: string;
    message: string;
    confirmLabel: string;
  };

  // Execution function - called after delay expires
  execute: (selectedImages: DisplayImage[], context: string) => Promise<void>;
}

export interface ConfirmationContent {
  title: string;
  message: string;
  confirmLabel: string;
}
