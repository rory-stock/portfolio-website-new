<script setup lang="ts">
import { iconData, type IconName } from "./icons/iconData";

const props = withDefaults(
  defineProps<{
    name: IconName;
    size?: string | number;
    stroke?: string;
    strokeWidth?: number;
  }>(),
  {
    size: 24,
  }
);

const icon = computed(() => iconData[props.name]);

const sizeValue = computed(() =>
  typeof props.size === "number" ? `${props.size}px` : props.size
);

const strokeValue = computed(() => props.stroke ?? icon.value.stroke);
const strokeWidthValue = computed(
  () => props.strokeWidth ?? icon.value.strokeWidth
);
</script>

<template>
  <svg
    :viewBox="icon.viewBox"
    :fill="icon.fill ?? 'currentColor'"
    :stroke="strokeValue"
    :stroke-linecap="icon.strokeLinecap"
    :stroke-linejoin="icon.strokeLinejoin"
    :stroke-width="strokeWidthValue"
    :style="{ width: sizeValue, height: sizeValue }"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      v-if="icon.path"
      :stroke="strokeValue ?? undefined"
      :stroke-width="strokeWidthValue ?? undefined"
      :d="icon.path"
      :fill-rule="icon.fillRule"
    />
    <path
      v-else
      v-for="(pathData, index) in icon.paths"
      :key="index"
      :stroke="strokeValue ?? undefined"
      :stroke-width="strokeWidthValue ?? undefined"
      :d="pathData"
      :fill-rule="icon.fillRule"
    />
  </svg>
</template>
