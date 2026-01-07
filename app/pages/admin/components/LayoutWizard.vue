<template>
  <div class="space-y-4 border-t border-neutral-800 pt-4">
    <h4 class="font-medium text-neutral-100">Layout Configuration</h4>

    <!-- Single container box -->
    <div class="rounded-lg border border-neutral-700 bg-neutral-800 p-4">
      <!-- Current Layout Display (when layout exists and wizard closed) -->
      <div
        v-if="props.currentImage.layout_type && !showWizard"
        class="flex flex-col justify-between gap-2 md:flex-row md:items-center md:gap-0"
      >
        <div class="flex flex-col gap-1 md:gap-0">
          <p class="text-sm text-neutral-400">Current Layout</p>
          <p class="font-medium text-neutral-100">
            {{ getLayoutLabel(props.currentImage.layout_type) }}
          </p>
          <p
            v-if="props.currentImage.layout_group_id"
            class="mt-1 text-xs text-neutral-500"
          >
            Group ID: {{ props.currentImage.layout_group_id }}
          </p>
        </div>
        <div class="flex flex-col gap-2 md:flex-row">
          <AppButton
            variant="secondary"
            @click="showWizard = true"
            class="bg-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-600"
          >
            Change Layout
          </AppButton>
          <AppButton
            variant="danger"
            @click="handleRemoveLayout"
            :disabled="removingLayout"
            :loading="removingLayout"
            class="px-3 py-1.5 text-sm"
          >
            Remove
          </AppButton>
        </div>
      </div>

      <!-- No Layout State (when no layout and wizard closed) -->
      <div
        v-if="!props.currentImage.layout_type && !showWizard"
        class="flex flex-col gap-4 md:flex-row md:items-center"
      >
        <span class="text-sm text-neutral-400">Layout: None</span>
        <AppButton
          variant="secondary"
          @click="showWizard = true"
          class="bg-neutral-700 px-4 py-2 text-sm hover:bg-neutral-600"
        >
          Assign Layout
        </AppButton>
      </div>

      <!-- Layout Wizard (when wizard open) -->
      <div v-if="showWizard" class="space-y-4">
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-neutral-700 pb-3"
        >
          <h5 class="font-medium text-neutral-100">
            {{ currentStep === 1 ? "Select Layout Type" : "Select Images" }}
          </h5>
          <button
            @click="handleCloseWizard"
            class="cursor-pointer text-neutral-400 transition-colors hover:text-neutral-200"
          >
            <Icon name="cross" width="16" height="16" />
          </button>
        </div>

        <!-- Step 1: Select Layout Type -->
        <div v-if="currentStep === 1">
          <LayoutTypeSelector
            :available-layout-types="availableLayoutTypes"
            :selected-layout-type="selectedLayoutType"
            @select="selectLayoutType"
          />

          <!-- Navigation -->
          <div class="mt-4 flex flex-col justify-end gap-2 md:flex-row">
            <AppButton
              variant="secondary"
              @click="handleCloseWizard"
              class="hover:bg-neutral-700"
            >
              Cancel
            </AppButton>
            <AppButton @click="goToStep2" :disabled="!selectedLayoutType">
              Next
            </AppButton>
          </div>
        </div>

        <!-- Step 2: Select Images -->
        <div v-if="currentStep === 2">
          <LayoutImagePicker
            :all-images="props.allImages"
            :current-image-id="props.currentImage.id"
            :selected-images="selectedImages"
            :images-in-layouts="imagesInLayouts"
            :needed-count="
              selectedLayoutType
                ? (LAYOUT_TYPES[selectedLayoutType]?.imageCount ?? 0)
                : 0
            "
            :validation-message="validationMessage"
            :can-select="canSelectImage"
            :get-position-label="getPositionLabel"
            @toggle="toggleImageSelection"
            @update:scroll-container="scrollContainer = $event"
          />

          <!-- Scrollbar -->
          <LayoutScrollbar
            :show-scrollbar="showScrollbar"
            :scrollbar-width="scrollbarWidth"
            :scrollbar-position="scrollbarPosition"
            :is-dragging="isDraggingScrollbar"
            :scroll-x="scrollX"
            :scroll-container="scrollContainer"
            @update:is-dragging="isDraggingScrollbar = $event"
            @update:scroll-x="scrollX = $event"
          />

          <!-- Navigation -->
          <div
            class="mt-4 flex flex-col justify-between gap-2 md:flex-row md:gap-0"
          >
            <AppButton
              variant="secondary"
              @click="goToStep1"
              class="flex w-full justify-center hover:bg-neutral-700 md:w-min"
            >
              <Icon name="back" :size="18" class="mt-0.5 mr-0.5" />
              Back
            </AppButton>
            <div class="flex flex-col gap-2 md:flex-row">
              <AppButton
                variant="secondary"
                type="button"
                @click="handleCloseWizard"
                class="hover:bg-neutral-700"
              >
                Cancel
              </AppButton>
              <AppButton
                @click="handleAssignLayout"
                :disabled="!canSubmit || assigningLayout"
                :loading="assigningLayout"
              >
                <template #loading>Assigning...</template>
                Assign Layout
              </AppButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ImageBase } from "~~/types/imageTypes";
import type { LayoutTypeId, LayoutType } from "~/utils/layouts";
import { LAYOUT_TYPES } from "~/utils/layouts";
import { useScroll } from "@vueuse/core";

interface Props {
  currentImage: ImageBase;
  allImages: ImageBase[];
  context: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "layout-assigned": [];
  "layout-removed": [];
}>();

const { error: showError } = useToast();

// Wizard state
const showWizard = ref(false);
const currentStep = ref(1);
const selectedLayoutType = ref<LayoutTypeId | null>(null);
const selectedImages = ref<number[]>([]);
const assigningLayout = ref(false);
const removingLayout = ref(false);

// Scroll container for image selection
const scrollContainer = ref<HTMLElement | null>(null);
const { x: scrollX } = useScroll(scrollContainer, {
  behavior: "smooth",
});

// Custom scrollbar state
const isDraggingScrollbar = ref(false);

// Scrollbar dimensions
const scrollbarWidth = computed(() => {
  if (!scrollContainer.value) return 0;
  const container = scrollContainer.value;
  const scrollWidth = container.scrollWidth;
  const clientWidth = container.clientWidth;
  if (scrollWidth <= clientWidth) return 100;
  return (clientWidth / scrollWidth) * 100;
});

const scrollbarPosition = computed(() => {
  if (!scrollContainer.value) return 0;
  const container = scrollContainer.value;
  const scrollWidth = container.scrollWidth;
  const clientWidth = container.clientWidth;
  const maxScroll = scrollWidth - clientWidth;
  if (maxScroll <= 0) return 0;
  return (scrollX.value / maxScroll) * (100 - scrollbarWidth.value);
});

const showScrollbar = computed(() => {
  if (!scrollContainer.value) return false;
  return scrollContainer.value.scrollWidth > scrollContainer.value.clientWidth;
});

// Get current image index
const currentImageIndex = computed(() => {
  return props.allImages.findIndex((img) => img.id === props.currentImage.id);
});

// Get images already in layouts (excluding current image's group)
const imagesInLayouts = computed(() => {
  const currentGroupId = props.currentImage.layout_group_id;
  return new Set(
    props.allImages
      .filter(
        (img) =>
          img.layout_type !== null && img.layout_group_id !== currentGroupId
      )
      .map((img) => img.id)
  );
});

// Get consecutive available images around current image
const consecutiveAvailableImages = computed(() => {
  const currentIdx = currentImageIndex.value;
  if (currentIdx === -1) return { before: 0, after: 0 };

  let before = 0;
  let after = 0;

  for (let i = currentIdx - 1; i >= 0; i--) {
    const img = props.allImages[i];
    if (!img || imagesInLayouts.value.has(img.id)) break;
    before++;
  }

  for (let i = currentIdx + 1; i < props.allImages.length; i++) {
    const img = props.allImages[i];
    if (!img || imagesInLayouts.value.has(img.id)) break;
    after++;
  }

  return { before, after };
});

// Filter available layout types based on consecutive images
const availableLayoutTypes = computed(() => {
  const available = consecutiveAvailableImages.value;
  const totalAvailable = 1 + available.before + available.after;

  return Object.entries(LAYOUT_TYPES).filter(([_, config]) => {
    return config.imageCount <= totalAvailable;
  }) as Array<[LayoutTypeId, LayoutType]>;
});

// Check if an image can be selected
const canSelectImage = (image: ImageBase): boolean => {
  if (!selectedLayoutType.value) return false;

  const layoutConfig = LAYOUT_TYPES[selectedLayoutType.value];
  if (!layoutConfig) return false;

  const neededCount = layoutConfig.imageCount;
  const currentSelected = selectedImages.value.length;

  const isSelected = selectedImages.value.includes(image.id);

  if (currentSelected >= neededCount && !isSelected) {
    return false;
  }

  if (imagesInLayouts.value.has(image.id)) return false;

  if (currentSelected > 0 && !isSelected) {
    const selectedIndices = selectedImages.value
      .map((id) => props.allImages.findIndex((img) => img.id === id))
      .sort((a, b) => a - b);

    const imageIdx = props.allImages.findIndex((img) => img.id === image.id);

    const minIdx = Math.min(...selectedIndices);
    const maxIdx = Math.max(...selectedIndices);

    if (imageIdx !== minIdx - 1 && imageIdx !== maxIdx + 1) {
      return false;
    }

    if (imageIdx < minIdx) {
      for (let i = imageIdx + 1; i < minIdx; i++) {
        const img = props.allImages[i];
        if (!img || imagesInLayouts.value.has(img.id)) return false;
      }
    } else if (imageIdx > maxIdx) {
      for (let i = maxIdx + 1; i < imageIdx; i++) {
        const img = props.allImages[i];
        if (!img || imagesInLayouts.value.has(img.id)) return false;
      }
    }
  }

  return true;
};

// Validate selected images are consecutive
const areImagesConsecutive = computed(() => {
  if (selectedImages.value.length <= 1) return true;

  const indices = selectedImages.value
    .map((id) => props.allImages.findIndex((img) => img.id === id))
    .sort((a, b) => a - b);

  for (let i = 1; i < indices.length; i++) {
    const prevIndex = indices[i - 1];
    const currIndex = indices[i];
    if (prevIndex === undefined || currIndex === undefined) return false;
    if (currIndex - prevIndex !== 1) {
      return false;
    }
  }

  return true;
});

// Validation message
const validationMessage = computed(() => {
  if (!selectedLayoutType.value) return "";

  const layoutConfig = LAYOUT_TYPES[selectedLayoutType.value];
  if (!layoutConfig) return "";

  const needed = layoutConfig.imageCount;
  const selected = selectedImages.value.length;

  if (selected < needed) {
    return `Select ${needed - selected} more image${needed - selected > 1 ? "s" : ""}`;
  }

  if (selected > needed) {
    return `Too many images selected (need ${needed})`;
  }

  if (!areImagesConsecutive.value) {
    return "Images must be consecutive (no gaps)";
  }

  return "Ready to assign";
});

// Can submit
const canSubmit = computed(() => {
  if (!selectedLayoutType.value) return false;
  const layoutConfig = LAYOUT_TYPES[selectedLayoutType.value];
  if (!layoutConfig) return false;

  return (
    selectedImages.value.length === layoutConfig.imageCount &&
    areImagesConsecutive.value
  );
});

// Get the position label for an image
const getPositionLabel = (image: ImageBase): string => {
  const currentIdx = currentImageIndex.value;
  const imageIdx = props.allImages.findIndex((img) => img.id === image.id);
  const diff = imageIdx - currentIdx;

  if (diff > 0) return `+${diff}`;
  return diff.toString();
};

// Get layout label
const getLayoutLabel = (layoutType: string): string => {
  return LAYOUT_TYPES[layoutType as LayoutTypeId]?.label || layoutType;
};

// Toggle image selection
const toggleImageSelection = (image: ImageBase) => {
  if (!canSelectImage(image)) return;

  if (image.id === props.currentImage.id) return;

  const index = selectedImages.value.indexOf(image.id);
  if (index > -1) {
    selectedImages.value.splice(index, 1);
  } else {
    selectedImages.value.push(image.id);
  }
};

// Select the layout type and go to step 2
const selectLayoutType = (layoutType: LayoutTypeId) => {
  selectedLayoutType.value = layoutType;
};

// Navigation
const goToStep2 = () => {
  currentStep.value = 2;
  selectedImages.value = [props.currentImage.id];

  nextTick(() => {
    if (scrollContainer.value) {
      const currentIdx = currentImageIndex.value;
      const imageWidth = 208;
      const containerWidth = scrollContainer.value.clientWidth;
      const scrollTo =
        currentIdx * imageWidth - containerWidth / 2 + imageWidth / 2;

      scrollContainer.value.scrollLeft = Math.max(0, scrollTo);
    }
  });
};

const goToStep1 = () => {
  currentStep.value = 1;
  selectedImages.value = [];
};

// Close wizard and reset
const handleCloseWizard = () => {
  showWizard.value = false;
  currentStep.value = 1;
  selectedLayoutType.value = null;
  selectedImages.value = [];
};

// Assign layout
const handleAssignLayout = async () => {
  if (!selectedLayoutType.value || !canSubmit.value) return;

  assigningLayout.value = true;

  try {
    const response = await $fetch("/api/images/layouts", {
      method: "POST",
      body: {
        image_ids: selectedImages.value,
        layout_type: selectedLayoutType.value,
        context: props.context,
      },
      headers: useRequestHeaders(["cookie"]),
    });

    if (response.success) {
      handleCloseWizard();
      emit("layout-assigned");
    }
  } catch (error: any) {
    showError(error.data?.message || "Failed to assign layout");
  } finally {
    assigningLayout.value = false;
  }
};

// Remove layout
const handleRemoveLayout = async () => {
  removingLayout.value = true;

  try {
    const response = await $fetch(`/api/images/${props.currentImage.id}`, {
      method: "PATCH",
      body: {
        remove_layout: true,
      },
      headers: useRequestHeaders(["cookie"]),
    });

    if (response.success) {
      emit("layout-removed");
    }
  } catch (error: any) {
    showError(error.data?.message || "Failed to remove layout");
  } finally {
    removingLayout.value = false;
  }
};
</script>
