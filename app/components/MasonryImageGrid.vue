<script setup lang="ts">
import { MasonryWall } from "@yeger/vue-masonry-wall";
import type { DisplayImage } from "~~/types/imageTypes";

const props = withDefaults(
  defineProps<{
    images: DisplayImage[];
    columnWidth?: number;
    maxColumns?: number;
    gap?: number;
  }>(),
  {
    gap: 6,
  }
);

const emit = defineEmits<{
  "image-click": [image: DisplayImage];
}>();
</script>

<template>
  <MasonryWall
    :items="images"
    :column-width="columnWidth"
    :max-columns="maxColumns"
    :gap="gap"
    :ssr-columns="3"
  >
    <template #default="{ item }: { item: DisplayImage }">
      <button
        type="button"
        class="group block w-full cursor-pointer overflow-hidden"
        :style="{ aspectRatio: `${item.width} / ${item.height}` }"
        @click="emit('image-click', item)"
        aria-label="View image"
      >
        <ProgressiveImage
          :src="item.url"
          :alt="item.alt ?? ''"
          :width="item.width"
          :height="item.height"
          :show-placeholder="false"
          img-class="h-full w-full object-cover"
        />
      </button>
    </template>
  </MasonryWall>
</template>
