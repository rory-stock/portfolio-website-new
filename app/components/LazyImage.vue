<script setup lang="ts">
import { useIntersectionObserver } from "@vueuse/core";

const props = withDefaults(
  defineProps<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
    imgClass?: string;
    rootMargin?: string;
  }>(),
  {
    imgClass: "h-full w-full object-cover",
    rootMargin: "200px",
  }
);

const containerRef = ref<HTMLElement | null>(null);
const isVisible = ref(false);
const isLoaded = ref(false);
const hasError = ref(false);

const { stop } = useIntersectionObserver(
  containerRef,
  (entries) => {
    if (entries[0]?.isIntersecting) {
      isVisible.value = true;
      stop();
    }
  },
  {
    rootMargin: props.rootMargin,
    threshold: 0.01,
  }
);

function onLoad() {
  isLoaded.value = true;
}

function onError() {
  hasError.value = true;
}

// Aspect ratio for placeholder sizing
const aspectRatio = computed(() => {
  if (props.width && props.height) {
    return props.width / props.height;
  }
  return undefined;
});
</script>

<template>
  <div
    ref="containerRef"
    class="overflow-hidden bg-neutral-900"
    :style="aspectRatio ? { aspectRatio: `${aspectRatio}` } : undefined"
  >
    <!-- Placeholder shown until image loads -->
    <div
      v-if="!isLoaded && !hasError"
      class="flex h-full w-full items-center justify-center"
    >
      <div
        v-if="isVisible"
        class="h-4 w-4 animate-spin rounded-full border-2 border-neutral-700 border-t-neutral-400"
      />
    </div>

    <!-- Error state -->
    <div
      v-if="hasError"
      class="flex h-full w-full items-center justify-center text-xs text-neutral-600"
    >
      Failed to load
    </div>

    <!-- Actual image (only rendered when in viewport) -->
    <img
      v-if="isVisible && !hasError"
      :src="src"
      :alt="alt"
      :class="[imgClass, { 'opacity-0': !isLoaded, 'opacity-100': isLoaded }]"
      class="transition-opacity duration-200"
      @load="onLoad"
      @error="onError"
    />
  </div>
</template>
