<script setup lang="ts">
interface DisplayImage {
  id: number;
  instance_id: number;
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

const props = defineProps<{
  images: DisplayImage[];
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  selectedIds?: Set<number>;
  coverImageId?: number | null;
}>();

const emit = defineEmits<{
  "image-click": [image: DisplayImage];
  "image-select": [imageInstanceId: number];
  "load-more": [];
  "set-cover": [imageInstanceId: number];
}>();

const isSelected = (image: DisplayImage) =>
  props.selectedIds?.has(image.instance_id) ?? false;

const isCover = (image: DisplayImage) =>
  props.coverImageId === image.instance_id;
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
        :key="image.instance_id"
        class="group relative aspect-4/3 cursor-pointer overflow-hidden rounded border border-neutral-800 bg-neutral-900 transition-all hover:border-neutral-600"
        :class="{
          'ring-2 ring-blue-500 ring-offset-1 ring-offset-neutral-950':
            isSelected(image),
        }"
        @click="emit('image-click', image)"
      >
        <!-- Image -->
        <img
          :src="image.url"
          :alt="image.alt"
          class="h-full w-full object-cover"
          loading="lazy"
        />

        <!-- Cover badge -->
        <div
          v-if="isCover(image)"
          class="absolute top-1.5 left-1.5 rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-medium text-white"
        >
          Cover
        </div>

        <!-- Hover overlay -->
        <div
          class="absolute inset-0 flex items-end bg-linear-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        >
          <div class="w-full p-2">
            <p class="truncate text-xs text-neutral-200">
              {{ image.original_filename }}
            </p>
          </div>
        </div>

        <!-- Select checkbox (visible on hover or when selected) -->
        <div
          v-if="selectedIds"
          class="absolute top-1.5 right-1.5 transition-opacity"
          :class="
            isSelected(image)
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
          "
          @click.stop="emit('image-select', image.instance_id)"
        >
          <div
            class="flex h-5 w-5 items-center justify-center rounded border text-xs"
            :class="
              isSelected(image)
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-neutral-400 bg-neutral-900/80 text-transparent hover:border-neutral-300'
            "
          >
            ✓
          </div>
        </div>

        <!-- Set as cover button (hover only) -->
        <button
          v-if="!isCover(image)"
          class="absolute right-1.5 bottom-1.5 rounded bg-neutral-800/90 px-1.5 py-0.5 text-[10px] text-neutral-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-neutral-700 hover:text-white"
          @click.stop="emit('set-cover', image.instance_id)"
        >
          Set cover
        </button>
      </div>
    </div>

    <!-- Load more -->
    <div v-if="hasMore" class="mt-6 text-center">
      <button
        :disabled="loadingMore"
        class="rounded border border-neutral-700 px-4 py-2 text-sm text-neutral-200 transition-colors hover:border-neutral-500 hover:text-white disabled:opacity-50"
        @click="emit('load-more')"
      >
        {{ loadingMore ? "Loading..." : "Load more" }}
      </button>
    </div>
  </div>
</template>
