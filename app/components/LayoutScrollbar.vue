<template>
  <div
    v-if="showScrollbar"
    class="relative h-2.5 w-full rounded-full border border-neutral-700 bg-neutral-900/30"
    @mousedown="handleTrackClick"
  >
    <div
      ref="thumbRef"
      class="absolute top-0 h-full cursor-grab rounded-full bg-neutral-600 transition-colors hover:bg-neutral-500"
      :class="{ 'cursor-grabbing': isDragging }"
      :style="{
        width: `${scrollbarWidth}%`,
        left: `${scrollbarPosition}%`,
      }"
      @mousedown="handleThumbMouseDown"
    ></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  showScrollbar: boolean;
  scrollbarWidth: number;
  scrollbarPosition: number;
  isDragging: boolean;
  scrollX: number;
  scrollContainer: HTMLElement | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:isDragging": [value: boolean];
  "update:scrollX": [value: number];
}>();

const thumbRef = ref<HTMLElement | null>(null);

const handleTrackClick = (e: MouseEvent) => {
  if (!props.scrollContainer) return;
  emit("update:isDragging", true);

  const track = e.currentTarget as HTMLElement;
  const trackRect = track.getBoundingClientRect();
  const clickX = e.clientX - trackRect.left;
  const trackWidth = trackRect.width;

  const container = props.scrollContainer;
  const maxScroll = container.scrollWidth - container.clientWidth;

  emit("update:scrollX", (clickX / trackWidth) * maxScroll);
};

const handleThumbMouseDown = (e: MouseEvent) => {
  e.stopPropagation();
  if (!props.scrollContainer) return;
  emit("update:isDragging", true);

  const startX = e.clientX;
  const startScrollX = props.scrollX;

  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (!props.scrollContainer) return;
    const deltaX = moveEvent.clientX - startX;
    const container = props.scrollContainer;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const trackWidth = container.clientWidth;
    const scrollDelta = (deltaX / trackWidth) * maxScroll;

    emit(
      "update:scrollX",
      Math.max(0, Math.min(maxScroll, startScrollX + scrollDelta))
    );
  };

  const handleMouseUp = () => {
    emit("update:isDragging", false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};
</script>
