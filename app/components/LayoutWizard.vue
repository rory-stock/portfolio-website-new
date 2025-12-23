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
          <button
            type="button"
            @click="showWizard = true"
            class="rounded bg-neutral-700 px-3 py-1.5 text-sm text-neutral-100 transition-colors hover:bg-neutral-600"
          >
            Change Layout
          </button>
          <button
            type="button"
            @click="handleRemoveLayout"
            :disabled="removingLayout"
            class="rounded bg-red-800 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ removingLayout ? "Removing..." : "Remove" }}
          </button>
        </div>
      </div>

      <!-- Assign Layout Button (when no layout and wizard closed) -->
      <button
        v-if="!props.currentImage.layout_type && !showWizard"
        type="button"
        @click="showWizard = true"
        class="hover:bg-neutral-750 w-full rounded-lg border-2 border-dashed border-neutral-600 px-4 py-3 text-neutral-300 transition-colors hover:border-neutral-500"
      >
        + Assign Layout
      </button>

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
            class="text-neutral-400 transition-colors hover:text-neutral-200"
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

          <div v-else class="grid grid-cols-2 gap-3">
            <button
              v-for="[key, layout] in availableLayoutTypes"
              :key="key"
              type="button"
              @click="selectLayoutType(key)"
              class="layout-card flex flex-col"
              :class="{ 'ring-2 ring-neutral-100': selectedLayoutType === key }"
            >
              <LayoutIcon :layout-type="key" class="h-20 w-full" />
              <div class="mt-2">
                <div class="font-medium text-neutral-100">
                  {{ layout.label }}
                </div>
                <div class="text-sm text-neutral-400">
                  {{ layout.description }}
                </div>
                <div class="mt-1 text-xs text-neutral-500">
                  {{ layout.imageCount }} image{{
                    layout.imageCount > 1 ? "s" : ""
                  }}
                </div>
              </div>
            </button>
          </div>

          <!-- Navigation -->
          <div class="mt-4 flex justify-end gap-2">
            <button
              @click="handleCloseWizard"
              class="rounded border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              @click="goToStep2"
              :disabled="!selectedLayoutType"
              class="rounded bg-neutral-100 px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
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
          <div
            ref="scrollContainer"
            class="relative no-scrollbar flex gap-3 overflow-x-auto pb-4"
          >
            <button
              v-for="image in props.allImages"
              :key="image.id"
              type="button"
              @click="toggleImageSelection(image)"
              :disabled="!canSelectImage(image)"
              class="image-select-button relative"
              :class="{
                selected: selectedImages.includes(image.id),
                current: image.id === props.currentImage.id,
                disabled: !canSelectImage(image),
                'in-layout': imagesInLayouts.has(image.id),
              }"
            >
              <NuxtPicture
                :src="image.r2_path"
                :alt="image.alt || 'Image'"
                loading="lazy"
                class="h-full w-full object-cover"
              />

              <!-- Position label -->
              <div
                class="absolute top-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white"
              >
                <span v-if="image.id === props.currentImage.id">Current</span>
                <span v-else>{{ getPositionLabel(image) }}</span>
              </div>

              <!-- In layout badge -->
              <div
                v-if="imagesInLayouts.has(image.id)"
                class="absolute top-2 right-2 rounded bg-neutral-700 px-2 py-1 text-xs text-neutral-300"
              >
                In Layout
              </div>

              <!-- Selected checkmark -->
              <div
                v-if="selectedImages.includes(image.id)"
                class="absolute inset-0 border-2 border-neutral-100 bg-neutral-100/10"
              >
                <div
                  class="absolute top-2 right-2 rounded-full bg-neutral-100 p-1"
                >
                  <svg
                    class="h-4 w-4 text-neutral-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            </button>
          </div>

          <!-- Validation message -->
          <div
            v-if="validationMessage"
            class="mt-3 text-center text-sm text-neutral-400"
          >
            {{ validationMessage }}
          </div>

          <!-- Navigation -->
          <div class="mt-4 flex justify-between">
            <button
              @click="goToStep1"
              class="rounded border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
            >
              Back
            </button>
            <div class="flex gap-2">
              <button
                type="button"
                @click="handleCloseWizard"
                class="rounded border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                @click="handleAssignLayout"
                :disabled="!canSubmit || assigningLayout"
                class="rounded bg-neutral-100 px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ assigningLayout ? "Assigning..." : "Assign Layout" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ImageBase } from "~~/types/imageTypes";
import { LAYOUT_TYPES } from "~~/types/layoutTypes";
import type { LayoutTypeId } from "~~/types/layoutTypes";
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

  // Can't select if already in another layout
  if (imagesInLayouts.value.has(image.id)) return false;

  // Can't select if it would create a gap
  const currentIdx = currentImageIndex.value;
  const imageIdx = props.allImages.findIndex((img) => img.id === image.id);
  const distance = Math.abs(imageIdx - currentIdx);

  // For layouts needing multiple images, check if within range
  if (neededCount > 1) {
    const maxDistance = neededCount - 1;
    if (distance > maxDistance) return false;
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
</script>

<style scoped>
.image-select-button {
  position: relative;
  height: 8rem;
  width: 12rem;
  flex-shrink: 0;
  cursor: pointer;
  overflow: hidden;
  border-radius: 0.5rem;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

.image-select-button:not(.disabled):hover {
  box-shadow: 0 0 0 2px rgb(229 229 229); /* neutral-200 */
}

.image-select-button.selected {
  box-shadow: 0 0 0 2px rgb(245 245 245); /* neutral-100 */
}

.image-select-button.current {
  box-shadow: 0 0 0 2px rgb(212 212 212); /* neutral-300 */
}

.image-select-button.disabled {
  cursor: not-allowed;
  opacity: 0.4;
  filter: grayscale(100%);
}

.image-select-button.in-layout {
  opacity: 0.6;
}

.layout-card {
  cursor: pointer;
  border-radius: 0.5rem;
  border: 1px solid rgb(64 64 64);
  background-color: rgb(38 38 38);
  padding: 1rem;
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

.layout-card:hover {
  border-color: rgb(82 82 82);
  background-color: rgb(42 42 42);
}
</style>
