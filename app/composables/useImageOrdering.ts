import type { DisplayImage, ImageGroup } from "~~/types/imageTypes";
import {
  flattenImagesForApi,
  organizeImagesForAdmin,
} from "~/utils/imageGroups";

export function useImageOrdering(
  context: string,
  images: Ref<DisplayImage[]>,
  hasLayouts: boolean
) {
  const { success, error } = useToast();

  // Transform images based on whether layouts are enabled
  const organizedItems = ref<(DisplayImage | ImageGroup)[]>([]);

  // CRITICAL: Snapshot of original order taken ONCE when images load
  const originalOrderSnapshot = ref<number[]>([]);

  watch(
    images,
    (newImages) => {
      if (!newImages || newImages.length === 0) {
        organizedItems.value = [];
        originalOrderSnapshot.value = [];
        return;
      }

      organizedItems.value = hasLayouts
        ? organizeImagesForAdmin(newImages)
        : [...newImages];

      // Take snapshot of original order using instanceId
      originalOrderSnapshot.value = hasLayouts
        ? flattenImagesForApi(organizeImagesForAdmin(newImages))
        : newImages.map((img) => img.instanceId);
    },
    { immediate: true }
  );

  // Track the current order (can change as the user drags)
  const currentOrder = computed(() => {
    return hasLayouts
      ? flattenImagesForApi(organizedItems.value)
      : (organizedItems.value as DisplayImage[]).map((img) => img.instanceId);
  });

  const orderChanged = computed(() => {
    if (currentOrder.value.length !== originalOrderSnapshot.value.length)
      return true;
    return currentOrder.value.some(
      (id, index) => id !== originalOrderSnapshot.value[index]
    );
  });

  // vue-draggable-plus configuration
  const outerDraggableOptions = computed(() => ({
    animation: 150,
    ghostClass: "opacity-50",
    dragClass: "cursor-grabbing",
  }));

  const innerDraggableOptions = {
    animation: 150,
    ghostClass: "opacity-50",
    dragClass: "cursor-grabbing",
  };

  // Save order to API
  const saving = ref(false);

  const handleSaveOrder = async (): Promise<boolean> => {
    saving.value = true;

    try {
      await $fetch("/api/images/reorder", {
        method: "POST",
        body: {
          context,
          order: currentOrder.value,
        },
      });

      success("Image order saved");
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save order";
      error(message);
      return false;
    } finally {
      saving.value = false;
    }
  };

  // Discard changes - reset to the original order
  const handleDiscardOrder = () => {
    organizedItems.value = hasLayouts
      ? organizeImagesForAdmin(images.value)
      : [...images.value];
    success("Order changes discarded");
  };

  return {
    organizedItems,
    orderChanged,
    saving,
    outerDraggableOptions,
    innerDraggableOptions,
    handleSaveOrder,
    handleDiscardOrder,
  };
}

export type UseImageOrderingReturn = ReturnType<typeof useImageOrdering>;
