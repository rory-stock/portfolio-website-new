import type { ImageBase, ImageGroupProxy } from "~~/types/imageTypes";
import {
  organizeImagesForAdmin,
  isImageGroupProxy,
  flattenImagesForApi,
} from "~/utils/imageGroups";

export function useImageOrdering(
  context: string,
  images: Ref<ImageBase[]>,
  hasLayouts: boolean
) {
  const { success, error } = useToast();

  // Transform images based on whether layouts are enabled
  const organizedItems = ref<(ImageBase | ImageGroupProxy)[]>([]);

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

      // Take snapshot of original order
      originalOrderSnapshot.value = hasLayouts
        ? flattenImagesForApi(organizeImagesForAdmin(newImages), newImages)
        : newImages.map((img) => img.id);
    },
    { immediate: true }
  );

  // Track the current order (can change as the user drags)
  const currentOrder = computed(() => {
    const result = hasLayouts
      ? flattenImagesForApi(organizedItems.value, images.value)
      : (organizedItems.value as ImageBase[]).map((img) => img.id);
    console.log("currentOrder recalculated:", result);
    return result;
  });

  const orderChanged = computed(() => {
    console.log("Checking orderChanged:", {
      currentLength: currentOrder.value.length,
      originalLength: originalOrderSnapshot.value.length,
      current: currentOrder.value,
      original: originalOrderSnapshot.value,
      changed: currentOrder.value.some(
        (id, index) => id !== originalOrderSnapshot.value[index]
      ),
    });

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
