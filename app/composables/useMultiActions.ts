import type { MultiAction } from "~~/types/multiActions";
import type { DisplayImage } from "~~/types/imageTypes";
import { LAYOUT_TYPES } from "~/utils/layouts";

export function useMultiActions(context: string) {
  /**
   * Get layout warnings for images
   */
  function getLayoutWarnings(images: DisplayImage[]): string[] {
    const warnings: string[] = [];
    const layoutGroups = new Map<number, DisplayImage[]>();

    // Group images by layout_group_id
    images.forEach((img) => {
      if (img.layout_group_id) {
        if (!layoutGroups.has(img.layout_group_id)) {
          layoutGroups.set(img.layout_group_id, []);
        }
        layoutGroups.get(img.layout_group_id)!.push(img);
      }
    });

    // Check each group
    for (const [groupId, groupImages] of layoutGroups) {
      const firstImage = groupImages[0];

      // Skip if no images or no layout type
      if (!firstImage?.layout_type) continue;

      const layoutType = firstImage.layout_type;
      const requiredCount = LAYOUT_TYPES[layoutType]?.imageCount || 0;

      // Not all group members selected = will break the layout
      if (groupImages.length < requiredCount) {
        const layoutLabel = LAYOUT_TYPES[layoutType]?.label || layoutType;
        warnings.push(
          `Layout "${layoutLabel}" requires ${requiredCount} images. Only ${groupImages.length} selected. Layout will be broken.`
        );
      }
    }

    return warnings;
  }

  /**
   * Get all warnings for an action
   */
  function getAllWarnings(
    action: MultiAction,
    images: DisplayImage[]
  ): string[] {
    const warnings: string[] = [];

    // Layout warnings (if the action breaks layouts)
    if (action.breaksLayouts) {
      warnings.push(...getLayoutWarnings(images));
    }

    // Action-specific warnings
    if (action.getWarnings) {
      warnings.push(...action.getWarnings(images));
    }

    return warnings;
  }

  // Define available actions
  const actions: MultiAction[] = [
    {
      id: "delete",
      message: "Deleting",
      label: "Delete",
      icon: "bin",
      variant: "danger",
      needsConfirmation: true,
      breaksLayouts: true,
      delay: 10000,

      getWarnings: (images) => {
        const warnings = [];
        if (images.some((img) => img.is_primary)) {
          warnings.push("You are deleting the primary image for this context");
        }
        return warnings;
      },

      getConfirmation: (images) => ({
        title: "Delete Images",
        message: `Are you sure you want to delete ${images.length} image${images.length > 1 ? "s" : ""}? This action cannot be undone.`,
        confirmLabel: "Delete",
      }),

      execute: async (images) => {
        await $fetch("/api/images/multi", {
          method: "DELETE",
          body: { instance_ids: images.map((img) => img.instanceId) },
        });
      },
    },

    {
      id: "toggle-visibility",
      message: "Toggling visibility",
      label: "Toggle visibility",
      icon: "openEye",
      variant: "secondary",
      needsConfirmation: false,
      breaksLayouts: false,
      delay: 5000,

      getWarnings: (images) => {
        const warnings = [];
        const privatizingPrimary = images.some(
          (img) => img.is_primary && img.is_public
        );
        if (privatizingPrimary) {
          warnings.push(
            "Making the primary image private will hide it from public view"
          );
        }
        return warnings;
      },

      execute: async (images) => {

        const makePublic = images.some((img) => !img.is_public);

        await $fetch("/api/images/multi", {
          method: "PATCH",
          body: {
            instance_ids: images.map((img) => img.instanceId),
            updates: { is_public: makePublic },
          },
        });
      },
    },
  ];

  return {
    actions,
    getAllWarnings,
  };
}
