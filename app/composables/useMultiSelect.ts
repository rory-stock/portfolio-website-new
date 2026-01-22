import { ref, computed } from "vue";
import { onKeyStroke } from "@vueuse/core";
import type { DisplayImage } from "~~/types/imageTypes";

interface UseMultiSelectOptions {
  images: Ref<DisplayImage[]>;
}

export function useMultiSelect(options: UseMultiSelectOptions) {
  const { images } = options;

  const selectedImageIds = ref<Set<number>>(new Set());
  const isSelectionMode = ref(false);
  const lastSelectedIndex = ref<number | null>(null);

  const hasSelection = computed(() => selectedImageIds.value.size > 0);
  const selectedCount = computed(() => selectedImageIds.value.size);
  const selectedImages = computed(() =>
    images.value.filter((img) => selectedImageIds.value.has(img.instanceId))
  );

  // Actions
  function toggleSelection(imageId: number) {
    if (selectedImageIds.value.has(imageId)) {
      selectedImageIds.value.delete(imageId);
    } else {
      selectedImageIds.value.add(imageId);
    }

    // Update the last selected index
    lastSelectedIndex.value = images.value.findIndex(
      (img) => img.instanceId === imageId
    );
  }

  function selectAll() {
    images.value.forEach((img) => {
      selectedImageIds.value.add(img.instanceId);
    });
  }

  function clearSelection() {
    selectedImageIds.value.clear();
    lastSelectedIndex.value = null;
  }

  function isSelected(imageId: number): boolean {
    return selectedImageIds.value.has(imageId);
  }

  function enterSelectionMode() {
    isSelectionMode.value = true;
  }

  function exitSelectionMode() {
    isSelectionMode.value = false;
    clearSelection();
  }

  // Range selection (Shift+Click)
  function selectRange(currentImageId: number) {
    const currentIndex = images.value.findIndex(
      (img) => img.instanceId === currentImageId
    );

    if (lastSelectedIndex.value === null) {
      toggleSelection(currentImageId);
      return;
    }

    const start = Math.min(lastSelectedIndex.value, currentIndex);
    const end = Math.max(lastSelectedIndex.value, currentIndex);

    for (let i = start; i <= end; i++) {
      const img = images.value[i];
      if (img && !isSelected(img.instanceId)) {
        selectedImageIds.value.add(img.instanceId);
      }
    }

    lastSelectedIndex.value = currentIndex;
  }

  // Apply filter selections
  function selectByFilter(filterIds: string[]) {
    const filters: Record<string, (img: DisplayImage) => boolean> = {
      "in-layout": (img) => img.layout_type !== null,
      "not-in-layout": (img) => img.layout_type === null,
      public: (img) => img.is_public,
      private: (img) => !img.is_public,
      primary: (img) => img.is_primary,
    };

    // AND logic: image must match ALL selected filters
    const matchingImages = images.value.filter((img) =>
      filterIds.every((filterId) => filters[filterId]?.(img) ?? false)
    );

    matchingImages.forEach((img) => {
      selectedImageIds.value.add(img.instanceId);
    });
  }

  // Keyboard shortcuts
  onKeyStroke("Escape", () => {
    if (isSelectionMode.value) {
      exitSelectionMode();
    }
  });

  onKeyStroke("a", (e) => {
    if ((e.ctrlKey || e.metaKey) && isSelectionMode.value) {
      e.preventDefault();
      selectAll();
    }
  });

  return {
    // State
    selectedImageIds: readonly(selectedImageIds),
    isSelectionMode: readonly(isSelectionMode),
    lastSelectedIndex: readonly(lastSelectedIndex),

    // Computed
    hasSelection,
    selectedCount,
    selectedImages,

    // Actions
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    enterSelectionMode,
    exitSelectionMode,
    selectRange,
    selectByFilter,
  };
}
