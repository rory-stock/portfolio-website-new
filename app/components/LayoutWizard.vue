<template>
  <div
    class="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4"
  >
    <h3 class="text-lg font-semibold text-neutral-100">Layout Configuration</h3>

    <!-- Current Layout Status -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="currentImage.layout_type && wizardStep === 0"
        class="rounded bg-neutral-800 p-3"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-neutral-400">Current Layout</p>
            <p class="text-base font-medium text-neutral-100">
              {{
                LAYOUT_TYPES[currentImage.layout_type]?.label ||
                currentImage.layout_type
              }}
            </p>
            <p
              v-if="currentImage.layout_group_id"
              class="text-xs text-neutral-500"
            >
              Group #{{ currentImage.layout_group_id }}
            </p>
          </div>
          <button
            type="button"
            @click="handleRemoveLayout"
            :disabled="removing"
            class="rounded bg-red-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {{ removing ? "Removing..." : "Remove Layout" }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- No Layout - Show Assign Button (hide when wizard active) -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="!currentImage.layout_type && wizardStep === 0"
        class="text-center"
      >
        <p class="mb-3 text-sm text-neutral-400">No layout assigned</p>
        <button
          type="button"
          @click="wizardStep = 1"
          class="rounded bg-neutral-100 px-4 py-2 text-sm text-neutral-980 transition-colors hover:bg-neutral-300"
        >
          Assign Layout
        </button>
      </div>
    </Transition>

    <!-- Change Layout Button (when layout exists, hide when wizard active) -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <button
        v-if="currentImage.layout_type && wizardStep === 0"
        type="button"
        @click="wizardStep = 1"
        class="w-full rounded border border-neutral-700 px-4 py-2 text-sm text-neutral-200 transition-colors hover:bg-neutral-800"
      >
        Change Layout
      </button>
    </Transition>

    <!-- Wizard Step 1: Layout Type Selection -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-x-4"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 -translate-x-4"
    >
      <div v-if="wizardStep === 1" class="space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium text-neutral-100">
            Step 1: Select Layout Type
          </h4>
          <button
            type="button"
            @click="cancelWizard"
            class="text-xs text-neutral-400 hover:text-neutral-200"
          >
            Cancel
          </button>
        </div>

        <!-- Layout Type Grid -->
        <div class="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div
            v-for="layout in Object.values(LAYOUT_TYPES)"
            :key="layout.id"
            @click="selectLayoutType(layout.id)"
            class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all hover:border-neutral-100 hover:bg-neutral-800"
            :class="
              selectedLayoutType === layout.id
                ? 'border-neutral-100 bg-neutral-800'
                : 'border-neutral-700'
            "
          >
            <!-- Visual Icon -->
            <div class="flex h-12 w-full items-center justify-center">
              <LayoutIcon :layout-type="layout.id" />
            </div>

            <!-- Label -->
            <div class="text-center">
              <p class="text-xs font-medium text-neutral-100">
                {{ layout.label }}
              </p>
              <p class="text-xs text-neutral-500">({{ layout.imageCount }})</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Wizard Step 2: Image Selection -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-x-4"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 -translate-x-4"
    >
      <div v-if="wizardStep === 2" class="space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium text-neutral-100">
            Step 2: Select {{ selectedLayoutConfig?.imageCount }} Images
          </h4>
          <button
            type="button"
            @click="wizardStep = 1"
            class="text-xs text-neutral-400 hover:text-neutral-200"
          >
            ← Back
          </button>
        </div>

        <p class="text-xs text-neutral-400">
          Select {{ requiredCount }} more
          {{ requiredCount === 1 ? "image" : "images" }} to group with the
          current image
        </p>

        <!-- Scrollable Image Selection (drag to scroll) -->
        <div v-if="availableImages.length > 0" class="space-y-2">
          <div
            ref="scrollContainer"
            class="cursor-grab overflow-x-auto scroll-smooth select-none active:cursor-grabbing"
            @mousedown="startDrag"
            @mousemove="onDrag"
            @mouseup="stopDrag"
            @mouseleave="stopDrag"
          >
            <div class="flex gap-2 pb-2">
              <div
                v-for="img in availableImages"
                :key="img.id"
                @click="toggleImageSelection(img)"
                :ref="
                  img.id === currentImage.id ? 'currentImageRef' : undefined
                "
                class="pointer-events-auto relative shrink-0 cursor-pointer rounded-md border-2 transition-all"
                :class="[
                  isImageSelected(img)
                    ? 'border-neutral-100'
                    : 'border-neutral-700 hover:border-neutral-500',
                ]"
              >
                <NuxtPicture
                  :src="img.r2_path"
                  :alt="img.alt"
                  format="webp"
                  :img-attrs="{
                    class: 'h-36 w-auto object-cover rounded',
                  }"
                />

                <!-- Position Label -->
                <div
                  class="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-neutral-400"
                >
                  {{ getImagePositionLabel(img) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Selected Count -->
          <p class="text-xs text-neutral-500">
            {{ selectedImages.length }} of
            {{ selectedLayoutConfig?.imageCount }} selected
          </p>
        </div>

        <!-- No valid images -->
        <div v-else class="rounded bg-neutral-800 p-4 text-center">
          <p class="text-sm text-neutral-400">
            Not enough consecutive images available for this layout.
          </p>
          <button
            type="button"
            @click="wizardStep = 1"
            class="mt-3 text-sm text-neutral-100 hover:text-neutral-300"
          >
            ← Choose a different layout
          </button>
        </div>

        <!-- Create Layout Button -->
        <button
          v-if="
            availableImages.length > 0 &&
            selectedImages.length === selectedLayoutConfig?.imageCount
          "
          type="button"
          @click="handleCreateLayout"
          :disabled="assigning"
          class="w-full rounded bg-neutral-100 px-4 py-2 text-sm text-neutral-980 transition-colors hover:bg-neutral-300 disabled:opacity-50"
        >
          {{ assigning ? "Creating Layout..." : "Create Layout" }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { ImageBase } from "~~/types/imageTypes";
import { LAYOUT_TYPES, type LayoutTypeId } from "~~/types/layoutTypes";

interface Props {
  currentImage: ImageBase;
  allImages: ImageBase[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "layout-assigned": [];
  "layout-removed": [];
}>();

const { success, error: showError } = useToast();

const wizardStep = ref(0);
const selectedLayoutType = ref<LayoutTypeId | null>(null);
const selectedImages = ref<ImageBase[]>([]);
const assigning = ref(false);
const removing = ref(false);

const scrollContainer = ref<HTMLElement | null>(null);
const currentImageRef = ref<HTMLElement | null>(null);

const isDragging = ref(false);
const startX = ref(0);
const scrollLeft = ref(0);

const selectedLayoutConfig = computed(() => {
  return selectedLayoutType.value
    ? LAYOUT_TYPES[selectedLayoutType.value]
    : null;
});

const requiredCount = computed(() => {
  if (!selectedLayoutConfig.value) return 0;
  return selectedLayoutConfig.value.imageCount - 1;
});

const currentImageIndex = computed(() => {
  return props.allImages.findIndex((img) => img.id === props.currentImage.id);
});

const availableImages = computed<ImageBase[]>(() => {
  if (!selectedLayoutConfig.value || wizardStep.value !== 2) return [];

  const needed = selectedLayoutConfig.value.imageCount;
  const currentIdx = currentImageIndex.value;

  if (currentIdx === -1) return [];

  const images = props.allImages;
  const maxBefore = Math.min(currentIdx, needed - 1);
  const maxAfter = Math.min(images.length - currentIdx - 1, needed - 1);

  const startIdx = currentIdx - maxBefore;
  const endIdx = currentIdx + maxAfter;
  const slice = images.slice(startIdx, endIdx + 1);

  return slice.filter((img) => {
    if (img.order === null) return false;

    const imgIdx = slice.indexOf(img);
    if (imgIdx > 0) {
      const prev = slice[imgIdx - 1];
      if (prev && prev.order !== null && img.order - prev.order !== 1) {
        return false;
      }
    }
    return true;
  });
});

function toggleImageSelection(image: ImageBase) {
  if (image.id === props.currentImage.id) return;

  const index = selectedImages.value.findIndex((img) => img.id === image.id);
  if (index > -1) {
    selectedImages.value.splice(index, 1);
  } else {
    if (
      selectedImages.value.length <
      (selectedLayoutConfig.value?.imageCount || 0)
    ) {
      selectedImages.value.push(image);
    }
  }
}

function isImageSelected(image: ImageBase): boolean {
  return (
    image.id === props.currentImage.id ||
    selectedImages.value.some((img) => img.id === image.id)
  );
}

function getImagePositionLabel(img: ImageBase): string {
  const currentIdx = props.allImages.findIndex(
    (i) => i.id === props.currentImage.id
  );
  const imgIdx = props.allImages.findIndex((i) => i.id === img.id);
  const relativePos = imgIdx - currentIdx;

  if (relativePos === 0) return "Current";
  if (relativePos < 0) return `−${Math.abs(relativePos)}`;
  return `+${relativePos}`;
}

function selectLayoutType(layoutId: LayoutTypeId) {
  selectedLayoutType.value = layoutId;

  const config = LAYOUT_TYPES[layoutId];
  if (!config) return;

  if (config.imageCount === 1) {
    handleCreateLayout();
  } else {
    wizardStep.value = 2;
  }
}

function startDrag(e: MouseEvent) {
  if (!scrollContainer.value) return;
  isDragging.value = true;
  startX.value = e.pageX - scrollContainer.value.offsetLeft;
  scrollLeft.value = scrollContainer.value.scrollLeft;
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value || !scrollContainer.value) return;
  e.preventDefault();
  const x = e.pageX - scrollContainer.value.offsetLeft;
  const walk = (x - startX.value) * 2; // Scroll speed multiplier
  scrollContainer.value.scrollLeft = scrollLeft.value - walk;
}

function stopDrag() {
  isDragging.value = false;
}

// Centre scroll on the current image when step 2 loads
watch(wizardStep, async (newStep) => {
  if (newStep === 2) {
    selectedImages.value = [props.currentImage];

    await nextTick();

    if (scrollContainer.value && currentImageRef.value) {
      const container = scrollContainer.value;
      const current = currentImageRef.value;

      container.scrollLeft =
        current.offsetLeft -
        container.clientWidth / 2 +
        current.clientWidth / 2;
    }
  }
});

watch(
  () => props.currentImage,
  () => {
    // Reset wizard when image changes (e.g., after layout assignment/removal)
    if (wizardStep.value !== 0) {
      cancelWizard();
    }
  },
  { deep: true }
);

async function handleCreateLayout() {
  if (!selectedLayoutType.value) return;

  const config = LAYOUT_TYPES[selectedLayoutType.value];
  if (!config) return;

  assigning.value = true;

  try {
    let imageIds: number[];

    if (config.imageCount === 1) {
      imageIds = [props.currentImage.id];
    } else {
      const allSelected = selectedImages.value;

      if (allSelected.length !== config.imageCount) {
        showError(`Please select exactly ${config.imageCount} images`);
        assigning.value = false;
        return;
      }

      const sorted = allSelected.sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );
      imageIds = sorted.map((img) => img.id);
    }

    await $fetch("/api/images/layouts", {
      method: "POST",
      body: {
        image_ids: imageIds,
        layout_type: selectedLayoutType.value,
        context: props.currentImage.context,
      },
    });

    success("Layout assigned successfully");
    emit("layout-assigned");
    cancelWizard();
  } catch (e: any) {
    showError(e.data?.message || e.message || "Failed to assign layout");
  } finally {
    assigning.value = false;
  }
}

async function handleRemoveLayout() {
  if (!props.currentImage.layout_type) return;

  if (
    !confirm("Remove this layout? This will affect all images in the group.")
  ) {
    return;
  }

  removing.value = true;

  try {
    await $fetch(`/api/images/${props.currentImage.id}`, {
      method: "PATCH",
      body: {
        remove_layout: true,
      },
    });

    success("Layout removed successfully");
    emit("layout-removed");
  } catch (e: any) {
    showError(e.data?.message || e.message || "Failed to remove layout");
  } finally {
    removing.value = false;
  }
}

function cancelWizard() {
  wizardStep.value = 0;
  selectedLayoutType.value = null;
  selectedImages.value = [];
}
</script>

<style scoped>
div::-webkit-scrollbar {
  display: block;
  height: 8px;
}
div::-webkit-scrollbar-track {
  background: rgb(38 38 38);
  border-radius: 4px;
}
div::-webkit-scrollbar-thumb {
  background: rgb(115 115 115);
  border-radius: 4px;
}
div::-webkit-scrollbar-thumb:hover {
  background: rgb(163 163 163);
}
</style>
