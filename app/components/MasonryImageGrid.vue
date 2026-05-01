<script setup lang="ts">
import { MasonryWall } from "@yeger/vue-masonry-wall";
import type { DisplayImage } from "~~/types/imageTypes";

const props = withDefaults(
  defineProps<{
    images: DisplayImage[];
    columnWidth?: number;
    maxColumns?: number;
    gap?: number;
    showDownload?: boolean;
  }>(),
  {
    gap: 6,
    showDownload: false,
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
      <div class="group relative w-fit cursor-pointer">
        <ProgressiveImage
          :src="item.url"
          :alt="item.alt ?? ''"
          :width="item.width"
          :height="item.height"
          :show-placeholder="false"
          img-class="h-full w-full"
          @click="emit('image-click', item)"
        />

        <div
          class="absolute bottom-0 h-8 w-full bg-linear-to-b from-black/0 via-black/30 via-70% to-black/50 lg:h-10 lg:via-black/40 lg:to-black/60 lg:opacity-0 lg:transition-opacity lg:duration-200 lg:group-hover:opacity-100"
        >
          <DownloadButton
            v-if="showDownload"
            :instance-id="item.instanceId"
            :context="item.context"
            :filename="item.original_filename"
            class="absolute right-2 bottom-1 cursor-pointer text-white lg:right-4 lg:bottom-2 lg:translate-y-5 lg:opacity-0 lg:transition-all lg:duration-300 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:hover:text-neutral-300"
          >
            <Icon name="download" :size="26" />
          </DownloadButton>
        </div>
      </div>
    </template>
  </MasonryWall>
</template>
