<template>
  <div class="h-full w-full">
    <!-- Fullscreen Hero -->
    <svg
      v-if="layoutType === 'fullscreen-hero'"
      viewBox="0 0 32 16"
      class="h-full w-full"
    >
      <rect
        x="1"
        y="0"
        width="30"
        height="16"
        fill="currentColor"
        opacity="0.2"
        rx="0.5"
      />
    </svg>

    <!-- Single Hero -->
    <svg
      v-else-if="layoutType === 'single-hero'"
      viewBox="0 0 32 16"
      class="h-full w-full"
    >
      <rect
        x="4"
        y="1"
        width="24"
        height="14"
        fill="currentColor"
        opacity="0.2"
        rx="0.5"
      />
    </svg>

    <!-- Dual Horizontal -->
    <svg
      v-else-if="layoutType === 'dual-horizontal'"
      viewBox="0 0 32 16"
      class="h-full w-full"
    >
      <rect
        x="0"
        y="0"
        width="15"
        height="16"
        fill="currentColor"
        opacity="0.2"
        rx="0.5"
      />
      <rect
        x="17"
        y="0"
        width="15"
        height="16"
        fill="currentColor"
        opacity="0.2"
        rx="0.5"
      />
    </svg>

    <!-- Triple Row -->
    <svg
      v-else-if="layoutType === 'triple-row'"
      viewBox="0 0 32 16"
      class="h-full w-full"
    >
      <rect
        x="0"
        y="0"
        width="9.5"
        height="16"
        fill="currentColor"
        opacity="0.2"
        rx="0.5"
      />
      <rect
        x="11"
        y="0"
        width="10"
        height="16"
        fill="currentColor"
        opacity="0.2"
        rx="0.5"
      />
      <rect
        x="22.5"
        y="0"
        width="9.5"
        height="16"
        fill="currentColor"
        opacity="0.2"
        rx="0.5"
      />
    </svg>

    <!-- Asymmetric Left -->
    <svg
      v-else-if="layoutType === 'asymmetric-left'"
      viewBox="0 0 32 16"
      class="h-full w-full"
    >
      <rect
        x="0"
        y="0"
        width="21"
        height="16"
        fill="currentColor"
        opacity="0.2"
        rx="0.5"
      />
      <rect
        x="23"
        y="0"
        width="9"
        height="16"
        fill="currentColor"
        opacity="0.2"
        rx="0.5"
      />
    </svg>

    <!-- Asymmetric Right -->
    <svg
      v-else-if="layoutType === 'asymmetric-right'"
      viewBox="0 0 32 16"
      class="h-full w-full"
    >
      <rect
        x="0"
        y="0"
        width="9"
        height="16"
        fill="currentColor"
        opacity="0.2"
        rx="0.5"
      />
      <rect
        x="11"
        y="0"
        width="21"
        height="16"
        fill="currentColor"
        opacity="0.2"
        rx="0.5"
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
