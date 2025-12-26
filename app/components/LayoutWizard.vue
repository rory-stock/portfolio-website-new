<template>
  <div class="space-y-4 border-t border-neutral-800 pt-4">
    <h4 class="font-medium text-neutral-100">Layout Configuration</h4>

    <!-- Single container box -->
    <div class="rounded-lg border border-neutral-700 bg-neutral-800 p-4">
      <!-- Current Layout Display (when layout exists and wizard closed) -->
      <div
        v-if="props.currentImage.layout_type && !showWizard"
        class="flex items-center justify-between"
      >
        <div>
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
        <div class="flex gap-2">
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
            class="px-3 py-1.5 text-xs"
          >
            Remove
          </AppButton>
        </div>
      </div>

      <!-- No Layout State (when no layout and wizard closed) -->
      <div
        v-if="!props.currentImage.layout_type && !showWizard"
        class="flex items-center gap-4"
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
          <div
            v-if="availableLayoutTypes.length === 0"
            class="py-8 text-center"
          >
            <p class="text-neutral-400">No layout types available.</p>
            <p class="mt-2 text-sm text-neutral-500">
              Images before or after this one may be in other layouts, leaving
              no consecutive images available.
            </p>
          </div>

          <div v-else class="flex flex-col gap-2 md:grid md:grid-cols-3">
            <button
              v-for="[key, layout] in availableLayoutTypes"
              :key="key"
              type="button"
              @click="selectLayoutType(key)"
              class="flex cursor-pointer flex-col rounded border p-3 text-left transition-colors duration-300"
              :class="
                selectedLayoutType === key
                  ? 'border-neutral-100 bg-neutral-800'
                  : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600 hover:bg-neutral-800'
              "
            >
              <LayoutIcon :layout-type="key" class="h-8 w-full" />
              <span class="mt-2 flex flex-col space-y-0.5">
                <span class="text-sm font-medium text-neutral-100">
                  {{ layout.label }}
                </span>
                <span class="text-xs text-neutral-400">
                  {{ layout.description }}
                </span>
                <span class="text-xs text-neutral-500">
                  {{ layout.imageCount }} image{{
                    layout.imageCount > 1 ? "s" : ""
                  }}
                </span>
              </span>
            </button>
          </div>

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
          <p class="mb-3 text-sm text-neutral-400">
            Select
            {{
              selectedLayoutType
                ? (LAYOUT_TYPES[selectedLayoutType]?.imageCount ?? 0)
                : 0
            }}
            consecutive image{{
              selectedLayoutType &&
              (LAYOUT_TYPES[selectedLayoutType]?.imageCount ?? 0) > 1
                ? "s"
                : ""
            }}
            for this layout. Images must be next to each other with no gaps.
          </p>

          <!-- Horizontal scrolling image picker -->
          <div class="relative">
            <!-- Left fade -->
            <div
              v-if="showScrollbar && !arrivedState.left"
              class="pointer-events-none absolute top-0 left-0 z-10 h-full w-10 bg-linear-to-r from-neutral-800 to-transparent md:w-16"
            ></div>

            <!-- Right fade -->
            <div
              v-if="showScrollbar && !arrivedState.right"
              class="pointer-events-none absolute top-0 right-0 z-10 h-full w-10 bg-linear-to-l from-neutral-800 to-transparent md:w-16"
            ></div>
            <div
              ref="scrollContainer"
              class="relative flex gap-3 overflow-x-auto pb-2"
            >
              <button
                v-for="image in props.allImages"
                :key="image.id"
                type="button"
                @click="toggleImageSelection(image)"
                :disabled="!canSelectImage(image)"
                class="relative flex h-32 w-48 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border transition-colors duration-300"
                :class="{
                  'border-none': selectedImages.includes(image.id),
                  'border border-neutral-300':
                    image.id === props.currentImage.id &&
                    !selectedImages.includes(image.id),
                  'border-neutral-700 hover:border-neutral-500':
                    canSelectImage(image) &&
                    !selectedImages.includes(image.id) &&
                    image.id !== props.currentImage.id,
                  'cursor-not-allowed border-transparent opacity-40 grayscale':
                    !canSelectImage(image),
                  'opacity-60': imagesInLayouts.has(image.id),
                }"
              >
                <NuxtPicture
                  :src="image.r2_path"
                  :alt="image.alt || 'Image'"
                  class="h-full w-full object-cover"
                />

                <!-- Position label -->
                <span
                  class="absolute top-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-neutral-100"
                >
                  <span v-if="image.id === props.currentImage.id">Current</span>
                  <span v-else>{{ getPositionLabel(image) }}</span>
                </span>

                <!-- In layout badge -->
                <span
                  v-if="imagesInLayouts.has(image.id)"
                  class="absolute top-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-neutral-100"
                >
                  In Layout
                </span>

                <!-- Selected state - just border -->
                <span
                  v-if="selectedImages.includes(image.id)"
                  class="pointer-events-none absolute inset-0 rounded-lg border-2 border-neutral-100"
                ></span>
              </button>
            </div>
          </div>

          <!-- Scrollbar -->
          <div
            v-if="showScrollbar"
            class="relative h-2.5 w-full rounded-full border border-neutral-700 bg-neutral-900/30"
            @mousedown="handleScrollbarMouseDown"
          >
            <div
              class="absolute top-0 h-full cursor-grab rounded-full bg-neutral-600 transition-colors hover:bg-neutral-500"
              :class="{ 'cursor-grabbing': isDraggingScrollbar }"
              :style="{
                width: `${scrollbarWidth}%`,
                left: `${scrollbarPosition}%`,
              }"
              @mousedown="handleScrollbarThumbMouseDown"
              ref="scrollbarThumb"
            ></div>
          </div>

          <!-- Validation message -->
          <div
            v-if="validationMessage"
            class="mt-3 text-center text-sm text-neutral-400"
          >
            {{ validationMessage }}
          </div>

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
import type { LayoutTypeId } from "~~/types/layoutTypes";
import { LAYOUT_TYPES } from "~~/types/layoutTypes";
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
const { x: scrollX, arrivedState } = useScroll(scrollContainer, {
  behavior: "smooth",
});

// Custom scrollbar state
const scrollbarThumb = ref<HTMLElement | null>(null);
const isDraggingScrollbar = ref(false);

// Scrollbar dimensions
const scrollbarWidth = computed(() => {
  if (!scrollContainer.value) return 0;
  const container = scrollContainer.value;
  const scrollWidth = container.scrollWidth;
  const clientWidth = container.clientWidth;
  if (scrollWidth <= clientWidth) return 100; // Full width if no scroll needed
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
          img.layout_type !== null &&
          img.layout_type !== "" &&
          img.layout_group_id !== currentGroupId // Allow selecting current group members
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

  // Count consecutive available images before
  for (let i = currentIdx - 1; i >= 0; i--) {
    const img = props.allImages[i];
    if (!img || imagesInLayouts.value.has(img.id)) break;
    before++;
  }

  // Count consecutive available images after
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
  const totalAvailable = 1 + available.before + available.after; // Include current image

  return Object.entries(LAYOUT_TYPES).filter(([_, config]) => {
    return config.imageCount <= totalAvailable;
  });
});

// Check if an image can be selected
const canSelectImage = (image: ImageBase): boolean => {
  if (!selectedLayoutType.value) return false;

  const layoutConfig = LAYOUT_TYPES[selectedLayoutType.value];
  if (!layoutConfig) return false;

  const neededCount = layoutConfig.imageCount;
  const currentSelected = selectedImages.value.length;

  // If already selected, allow interaction (for deselection)
  const isSelected = selectedImages.value.includes(image.id);

  // If we have enough images selected, disable all non-selected images
  if (currentSelected >= neededCount && !isSelected) {
    return false;
  }

  // Can't select if already in another layout
  if (imagesInLayouts.value.has(image.id)) return false;

  // If some images are selected, check if this one would create a gap
  if (currentSelected > 0 && !isSelected) {
    const selectedIndices = selectedImages.value
      .map((id) => props.allImages.findIndex((img) => img.id === id))
      .sort((a, b) => a - b);

    const imageIdx = props.allImages.findIndex((img) => img.id === image.id);

    // Check if adding this image would maintain consecutiveness
    const minIdx = Math.min(...selectedIndices);
    const maxIdx = Math.max(...selectedIndices);

    // Image must be adjacent to the current selection range
    if (imageIdx !== minIdx - 1 && imageIdx !== maxIdx + 1) {
      return false;
    }

    // Check if there's a gap between this image and the selection
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

  return "Ready to assign"; // Valid
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

  // Prevent deselecting the current image
  if (image.id === props.currentImage.id) return;

  const index = selectedImages.value.indexOf(image.id);
  if (index > -1) {
    selectedImages.value.splice(index, 1);
  } else {
    selectedImages.value.push(image.id);
  }
};

// Select the layout type and go to step 2
const selectLayoutType = (layoutType: string) => {
  selectedLayoutType.value = layoutType as LayoutTypeId;
};

// Navigation
const goToStep2 = () => {
  currentStep.value = 2;
  selectedImages.value = [props.currentImage.id];

  // Only scroll once on the initial step 2 load
  nextTick(() => {
    if (scrollContainer.value) {
      const currentIdx = currentImageIndex.value;
      const imageWidth = 208; // 12rem (w-48) + 0.75rem gap
      const containerWidth = scrollContainer.value.clientWidth;
      const scrollTo =
        currentIdx * imageWidth - containerWidth / 2 + imageWidth / 2;

      // Use scrollLeft instead of VueUse scrollX for one-time scroll
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
      emit("layout-assigned"); // Only emit AFTER a successful API call
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
      emit("layout-removed"); // Only emit AFTER a successful API call
    }
  } catch (error: any) {
    showError(error.data?.message || "Failed to remove layout");
  } finally {
    removingLayout.value = false;
  }
};

// Scrollbar drag handlers
const handleScrollbarMouseDown = (e: MouseEvent) => {
  if (!scrollContainer.value) return;
  isDraggingScrollbar.value = true;

  const track = e.currentTarget as HTMLElement;
  const trackRect = track.getBoundingClientRect();
  const clickX = e.clientX - trackRect.left;
  const trackWidth = trackRect.width;

  const container = scrollContainer.value;
  const maxScroll = container.scrollWidth - container.clientWidth;

  scrollX.value = (clickX / trackWidth) * maxScroll;
};

const handleScrollbarThumbMouseDown = (e: MouseEvent) => {
  e.stopPropagation();
  if (!scrollContainer.value) return;
  isDraggingScrollbar.value = true;

  const startX = e.clientX;
  const startScrollX = scrollX.value;

  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (!scrollContainer.value) return;
    const deltaX = moveEvent.clientX - startX;
    const container = scrollContainer.value;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const trackWidth = container.clientWidth;
    const scrollDelta = (deltaX / trackWidth) * maxScroll;

    scrollX.value = Math.max(
      0,
      Math.min(maxScroll, startScrollX + scrollDelta)
    );
  };

  const handleMouseUp = () => {
    isDraggingScrollbar.value = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};
</script>
