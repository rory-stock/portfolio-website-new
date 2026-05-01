<script setup lang="ts">
import { isDownloadableContext } from "~/utils/constants";

const props = withDefaults(
  defineProps<{
    instanceId: number;
    context: string;
    filename?: string;
    class?: string;
  }>(),
  {
    filename: "",
    class: "",
  }
);

// Client-side guard — don't render if context doesn't allow downloads
const isAllowed = computed(() => isDownloadableContext(props.context));

const { isDownloading, downloadImage } = useImageDownload();

async function handleClick(event: MouseEvent) {
  // Prevent parent handlers (e.g. lightbox open, image select)
  event.stopPropagation();
  event.preventDefault();

  await downloadImage(props.instanceId);
}
</script>

<template>
  <button
    v-if="isAllowed"
    type="button"
    :class="props.class"
    :disabled="isDownloading"
    :aria-label="`Download ${filename || 'image'}`"
    @click="handleClick"
  >
    <slot></slot>
  </button>
</template>
