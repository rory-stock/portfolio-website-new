<template>
  <div class="h-full w-full text-neutral-400">
    <!-- Fullscreen Hero -->
    <svg
      v-if="layoutType === 'fullscreen-hero'"
      viewBox="0 0 40 30"
      class="h-full w-full"
    >
      <rect
        x="1"
        y="1"
        width="38"
        height="28"
        fill="currentColor"
        opacity="0.3"
        stroke="currentColor"
        stroke-width="1"
      />
    </svg>

    <!-- Single Hero -->
    <svg
      v-else-if="layoutType === 'single-hero'"
      viewBox="0 0 40 30"
      class="h-full w-full"
    >
      <rect
        x="6"
        y="4"
        width="28"
        height="22"
        fill="currentColor"
        opacity="0.3"
        stroke="currentColor"
        stroke-width="1"
      />
    </svg>

    <!-- Dual Horizontal -->
    <svg
      v-else-if="layoutType === 'dual-horizontal'"
      viewBox="0 0 40 30"
      class="h-full w-full"
    >
      <rect
        x="1"
        y="4"
        width="18"
        height="22"
        fill="currentColor"
        opacity="0.3"
        stroke="currentColor"
        stroke-width="1"
      />
      <rect
        x="21"
        y="4"
        width="18"
        height="22"
        fill="currentColor"
        opacity="0.3"
        stroke="currentColor"
        stroke-width="1"
      />
    </svg>

    <!-- Triple Row -->
    <svg
      v-else-if="layoutType === 'triple-row'"
      viewBox="0 0 40 30"
      class="h-full w-full"
    >
      <rect
        x="1"
        y="4"
        width="11"
        height="22"
        fill="currentColor"
        opacity="0.3"
        stroke="currentColor"
        stroke-width="1"
      />
      <rect
        x="14"
        y="4"
        width="12"
        height="22"
        fill="currentColor"
        opacity="0.3"
        stroke="currentColor"
        stroke-width="1"
      />
      <rect
        x="28"
        y="4"
        width="11"
        height="22"
        fill="currentColor"
        opacity="0.3"
        stroke="currentColor"
        stroke-width="1"
      />
    </svg>

    <!-- Asymmetric Left -->
    <svg
      v-else-if="layoutType === 'asymmetric-left'"
      viewBox="0 0 40 30"
      class="h-full w-full"
    >
      <rect
        x="1"
        y="1"
        width="25"
        height="28"
        fill="currentColor"
        opacity="0.3"
        stroke="currentColor"
        stroke-width="1"
      />
      <rect
        x="28"
        y="1"
        width="11"
        height="28"
        fill="currentColor"
        opacity="0.3"
        stroke="currentColor"
        stroke-width="1"
      />
    </svg>

    <!-- Asymmetric Right -->
    <svg
      v-else-if="layoutType === 'asymmetric-right'"
      viewBox="0 0 40 30"
      class="h-full w-full"
    >
      <rect
        x="1"
        y="1"
        width="11"
        height="28"
        fill="currentColor"
        opacity="0.3"
        stroke="currentColor"
        stroke-width="1"
      />
      <rect
        x="14"
        y="1"
        width="25"
        height="28"
        fill="currentColor"
        opacity="0.3"
        stroke="currentColor"
        stroke-width="1"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import type { LayoutTypeId } from "~~/types/layoutTypes";

interface Props {
  layoutType: LayoutTypeId;
}

defineProps<Props>();
</script>
