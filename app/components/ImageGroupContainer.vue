<template>
  <div
    class="relative cursor-move rounded-lg border-2 border-neutral-100 bg-neutral-900 p-3"
  >
    <!-- Group Badge -->
    <div
      class="absolute -top-3 left-3 flex gap-1 bg-neutral-900 px-2 py-0.5 text-xs text-neutral-400"
    >
      <Icon name="dashboard" :size="15" />
      {{ layoutLabel }}
    </div>

    <!-- Inner Draggable - Isolated in this component -->
    <VueDraggable
      v-model="localImages"
      :animation="150"
      ghost-class="opacity-50"
      drag-class="cursor-grabbing"
      :class="['grid gap-3', gridClass]"
    >
      <div
        v-for="img in localImages"
        :key="img.id"
        class="h-fit w-fit cursor-move"
      >
        <ImageAdminThumbnail
          :image="img"
          @click="$emit('openModal', img)"
          @toggle-primary="$emit('togglePrimary', img)"
        />
      </div>
    </VueDraggable>
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from "vue-draggable-plus";
import type { ImageBase } from "~~/types/imageTypes";
import { LAYOUT_TYPES } from "~~/types/layoutTypes";

interface Props {
  groupImages: ImageBase[];
  layoutType: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  update: [images: ImageBase[]];
  openModal: [image: ImageBase];
  togglePrimary: [image: ImageBase];
}>();

// Local copy of images for v-model
const localImages = computed({
  get: () => props.groupImages,
  set: (value) => emit("update", value),
});

const layoutLabel = computed(
  () => LAYOUT_TYPES[props.layoutType]?.label || props.layoutType
);

const gridClass = computed(() => {
  const count = LAYOUT_TYPES[props.layoutType]?.imageCount || 1;
  const baseClasses = "grid gap-3";
  const cols =
    {
      2: "grid-cols-2",
      3: "grid-cols-3",
    }[count] || "grid-cols-1";
  return `${baseClasses} ${cols}`;
});
</script>
