<script setup lang="ts">
import { useBreakpoints, breakpointsTailwind } from "@vueuse/core";

interface DisplayImage {
  id: number;
  instanceId: number;
  url: string;
  alt: string;
  width: number;
  height: number;
  file_size: number;
  original_filename: string;
  captured_at: string | null;
  description: string | null;
  is_public: boolean;
  context: string;
}

const props = withDefaults(
  defineProps<{
    images: DisplayImage[];
    loading?: boolean;
    loadingMore?: boolean;
    hasMore?: boolean;
    selectedIds?: Set<number>;
    coverImageInstanceId?: number | null;
    isSelectionMode?: boolean;
  }>(),
  {
    isSelectionMode: false,
  }
);

const emit = defineEmits<{
  "image-click": [image: DisplayImage];
  "image-select": [imageInstanceId: number, event: MouseEvent];
  "load-more": [];
  "set-cover": [imageInstanceId: number];
}>();

const isSelected = (image: DisplayImage) =>
  props.selectedIds?.has(image.instanceId) ?? false;

const isCover = (image: DisplayImage) =>
  props.coverImageInstanceId === image.instanceId;

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = computed(() => breakpoints.isSmaller("md"));

function handleImageClick(image: DisplayImage, event: MouseEvent) {
  if (props.isSelectionMode) {
    emit("image-select", image.instanceId, event);
  } else {
    emit("image-click", image);
  }
}
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="loading" class="py-12 text-center text-neutral-400">
      Loading images...
    </div>

    <!-- Empty state -->
    <div
      v-else-if="images.length === 0"
      class="py-12 text-center text-neutral-500"
    >
      No images in this folder yet.
    </div>

    <!-- Image grid -->
    <div
      v-else
      class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
    >
      <div
        v-for="image in images"
        :key="image.instanceId"
        class="group relative cursor-pointer overflow-hidden rounded border border-neutral-800 bg-neutral-900 transition-all hover:border-neutral-600"
        :class="{
          'ring-2 ring-blue-500 ring-offset-1 ring-offset-neutral-950':
            isSelected(image),
        }"
        @click="handleImageClick(image, $event)"
      >
        <!-- Image -->
        <ProgressiveImage
          :src="image.url"
          :alt="image.alt"
          :width="image.width"
          :height="image.height"
          img-class="h-full w-full object-cover"
        />

        <!-- Cover badge -->
        <div
          v-if="isCover(image)"
          class="absolute top-1.5 left-1.5 rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-medium text-white"
        >
          Cover
        </div>

        <!-- Selection overlay -->
        <div
          v-if="isSelectionMode && isSelected(image)"
          class="absolute inset-0 z-10 flex items-center justify-center bg-black/60"
        >
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900/90"
          >
            <Icon name="check" :size="20" class="text-neutral-100" />
          </div>
        </div>

        <!-- Hover overlay -->
        <div
          v-if="!isSelectionMode"
          class="absolute inset-0 flex items-end bg-linear-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        >
          <div class="w-full p-2">
            <p class="truncate text-xs text-neutral-200">
              {{ image.original_filename }}
            </p>
          </div>
        </div>

        <!-- Select checkbox -->
        <div
          v-if="selectedIds && !isSelectionMode"
          class="absolute top-1.5 right-1.5 transition-opacity"
          :class="
            isSelected(image)
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
          "
          @click.stop="emit('image-select', image.instanceId, $event)"
        >
          <div
            class="flex h-5 w-5 items-center justify-center rounded border text-xs"
            :class="
              isSelected(image)
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-neutral-400 bg-neutral-900/80 text-transparent hover:border-neutral-300'
            "
          >
            <Icon name="check" :size="14" />
          </div>
        </div>

        <!-- Set as cover button -->
        <AppButton
          v-if="!isCover(image) && !isMobile && !isSelectionMode"
          variant="secondary"
          text-size="sm"
          class="absolute top-1.5 left-1.5 rounded bg-neutral-800/90 px-1.5 py-0.5 text-[10px] text-neutral-200 opacity-0 group-hover:opacity-100 hover:bg-neutral-700"
          @click.stop="emit('set-cover', image.instanceId)"
        >
          Set cover
        </AppButton>
      </div>
    </div>

    <!-- Load more -->
    <div v-if="hasMore" class="mt-6 text-center">
      <AppButton
        variant="secondary"
        text-size="sm"
        :disabled="loadingMore"
        @click="emit('load-more')"
      >
        {{ loadingMore ? "Loading..." : "Load more" }}
      </AppButton>
    </div>
  </div>
</template>
