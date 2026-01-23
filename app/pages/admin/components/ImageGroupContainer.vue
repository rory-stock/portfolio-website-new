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
      class="flex justify-around gap-2"
    >
      <div
        v-for="img in localImages"
        :key="img.instanceId"
        class="h-fit w-fit cursor-move"
      >
        <ImageAdminThumbnail
          :image="img"
          :isSelectionMode="isSelectionMode"
          :isSelected="isSelected(img.instanceId)"
          @click="handleClick($event, img)"
          @toggle-primary="$emit('togglePrimary', img)"
        />
      </div>
    </VueDraggable>
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from "vue-draggable-plus";
import type { DisplayImage } from "~~/types/imageTypes";
import { LAYOUT_TYPES } from "~/utils/layouts";
import type { LayoutTypeId } from "~/utils/layouts";

interface Props {
  groupImages: DisplayImage[];
  layoutType: LayoutTypeId;
  isSelectionMode?: boolean;
  isSelected?: (instanceId: number) => boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSelectionMode: false,
  isSelected: () => false,
});

const emit = defineEmits<{
  update: [images: DisplayImage[]];
  openModal: [image: DisplayImage];
  togglePrimary: [image: DisplayImage];
  imageClick: [event: MouseEvent, image: DisplayImage];
}>();

// Local copy of images for v-model
const localImages = computed({
  get: () => props.groupImages,
  set: (value) => emit("update", value),
});

const layoutLabel = computed(
  () => LAYOUT_TYPES[props.layoutType]?.label || props.layoutType
);

function handleClick(event: MouseEvent, image: DisplayImage) {
  if (props.isSelectionMode) {
    // In selection mode, emit the click event for parent to handle
    emit("imageClick", event, image);
  } else {
    // Not in selection mode, open modal
    emit("openModal", image);
  }
}
</script>
