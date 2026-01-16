<template>
  <div>
    <p class="mb-3 text-sm text-neutral-400">
      Select {{ neededCount }} consecutive image{{ neededCount > 1 ? "s" : "" }}
      for this layout. Images must be next to each other with no gaps.
    </p>

    <!-- Horizontal scrolling image picker -->
    <div class="relative">
      <!-- Left fade -->
      <div
        v-if="showFade && !arrivedState.left"
        class="pointer-events-none absolute top-0 left-0 z-10 h-full w-10 bg-linear-to-r from-neutral-800 to-transparent md:w-16"
      ></div>

      <!-- Right fade -->
      <div
        v-if="showFade && !arrivedState.right"
        class="pointer-events-none absolute top-0 right-0 z-10 h-full w-10 bg-linear-to-l from-neutral-800 to-transparent md:w-16"
      ></div>

      <div
        ref="scrollContainer"
        class="relative flex gap-3 overflow-x-auto pb-2"
      >
        <button
          v-for="image in allImages"
          :key="image.instanceId"
          type="button"
          @click="emit('toggle', image)"
          :disabled="!canSelect(image)"
          class="relative flex h-32 w-48 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border transition-colors duration-300"
          :class="{
            'border-none': selectedImages.includes(image.instanceId),
            'border border-neutral-300':
              image.instanceId === currentImageId &&
              !selectedImages.includes(image.instanceId),
            'border-neutral-700 hover:border-neutral-500':
              canSelect(image) &&
              !selectedImages.includes(image.instanceId) &&
              image.instanceId !== currentImageId,
            'cursor-not-allowed border-transparent opacity-40 grayscale':
              !canSelect(image),
            'opacity-60': imagesInLayouts.has(image.instanceId),
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
            <span v-if="image.instanceId === currentImageId">Current</span>
            <span v-else>{{ getPositionLabel(image) }}</span>
          </span>

          <!-- In layout badge -->
          <span
            v-if="imagesInLayouts.has(image.instanceId)"
            class="absolute top-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-neutral-100"
          >
            In Layout
          </span>

          <!-- Selected state - just border -->
          <span
            v-if="selectedImages.includes(image.instanceId)"
            class="pointer-events-none absolute inset-0 rounded-lg border-2 border-neutral-100"
          ></span>
        </button>
      </div>
    </div>

    <!-- Validation message -->
    <div
      v-if="validationMessage"
      class="mt-3 text-center text-sm text-neutral-400 select-none"
    >
      {{ validationMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DisplayImage } from "~~/types/imageTypes";
import { useScroll } from "@vueuse/core";

interface Props {
  allImages: DisplayImage[];
  currentImageId: number;
  selectedImages: number[];
  imagesInLayouts: Set<number>;
  neededCount: number;
  validationMessage: string;
  canSelect: (image: DisplayImage) => boolean;
  getPositionLabel: (image: DisplayImage) => string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  toggle: [image: DisplayImage];
  "update:scrollContainer": [element: HTMLElement];
}>();

// Scroll container for image selection
const scrollContainer = ref<HTMLElement | null>(null);
const { arrivedState } = useScroll(scrollContainer, {
  behavior: "smooth",
});

const showFade = computed(() => {
  if (!scrollContainer.value) return false;
  return scrollContainer.value.scrollWidth > scrollContainer.value.clientWidth;
});

// Emit scroll container and arrived state to parent
watch(scrollContainer, (el) => {
  if (el) emit("update:scrollContainer", el);
});
</script>
