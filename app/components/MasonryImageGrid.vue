<script setup lang="ts">
import { MasonryWall } from "@yeger/vue-masonry-wall";
import type { DisplayImage } from "~~/types/imageTypes";

const props = withDefaults(
  defineProps<{
    images: DisplayImage[];
    columnWidth?: number;
    gap?: number;
  }>(),
  {
    columnWidth: 350,
    gap: 4,
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
          img-class="h-full w-full object-cover"
        />
      </button>
    </template>
  </MasonryWall>
</template>
