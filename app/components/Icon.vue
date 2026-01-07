<script setup lang="ts">
import { iconData, type IconName } from "./icons/iconData";

const props = withDefaults(
  defineProps<{
    name: IconName;
    size?: string | number;
    fill?: string;
    fillOpacity?: string | number;
    stroke?: string;
    strokeWidth?: string | number;
    strokeOpacity?: string | number;
    strokeLinecap?: "round" | "butt" | "square" | "inherit";
    strokeLinejoin?: "round" | "inherit" | "bevel" | "miter";
    strokeMiterlimit?: string | number;
    fillRule?: "nonzero" | "evenodd" | "inherit";
    clipRule?: "nonzero" | "evenodd" | "inherit";
    opacity?: string | number;
  }>(),
  {
    size: 24,
  }
);

const icon = computed(() => iconData[props.name]);

const sizeValue = computed(() =>
  typeof props.size === "number" ? `${props.size}px` : props.size
);

// Computed values that allow prop overrides
const fillValue = computed(
  () => props.fill ?? icon.value.fill ?? "currentColor"
);
const fillOpacityValue = computed(
  () => props.fillOpacity ?? icon.value.fillOpacity
);
const strokeValue = computed(() => props.stroke ?? icon.value.stroke);
const strokeWidthValue = computed(
  () => props.strokeWidth ?? icon.value.strokeWidth
);
const strokeOpacityValue = computed(
  () => props.strokeOpacity ?? icon.value.strokeOpacity
);
const strokeLinecapValue = computed(
  () => props.strokeLinecap ?? icon.value.strokeLinecap
);
const strokeLinejoinValue = computed(
  () => props.strokeLinejoin ?? icon.value.strokeLinejoin
);
const strokeMiterlimitValue = computed(
  () => props.strokeMiterlimit ?? icon.value.strokeMiterlimit
);
const fillRuleValue = computed(() => props.fillRule ?? icon.value.fillRule);
const clipRuleValue = computed(() => props.clipRule ?? icon.value.clipRule);
const opacityValue = computed(() => props.opacity ?? icon.value.opacity);
</script>

<template>
  <svg
    :viewBox="icon.viewBox"
    :style="{ width: sizeValue, height: sizeValue }"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      v-if="icon.path"
      :d="icon.path"
      :fill="fillValue"
      :fill-opacity="fillOpacityValue"
      :fill-rule="fillRuleValue"
      :stroke="strokeValue"
      :stroke-width="strokeWidthValue"
      :stroke-opacity="strokeOpacityValue"
      :stroke-linecap="strokeLinecapValue"
      :stroke-linejoin="strokeLinejoinValue"
      :stroke-miterlimit="strokeMiterlimitValue"
      :clip-rule="clipRuleValue"
      :opacity="opacityValue"
    />
    <path
      v-else
      v-for="(pathData, index) in icon.paths"
      :key="index"
      :d="pathData"
      :fill="fillValue"
      :fill-opacity="fillOpacityValue"
      :fill-rule="fillRuleValue"
      :stroke="strokeValue"
      :stroke-width="strokeWidthValue"
      :stroke-opacity="strokeOpacityValue"
      :stroke-linecap="strokeLinecapValue"
      :stroke-linejoin="strokeLinejoinValue"
      :stroke-miterlimit="strokeMiterlimitValue"
      :clip-rule="clipRuleValue"
      :opacity="opacityValue"
    />
  </svg>
</template>
