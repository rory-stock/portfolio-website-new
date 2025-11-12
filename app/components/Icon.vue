<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size ?? width ?? 15"
    :height="size ?? height ?? 15"
    :viewBox="iconData[name].viewBox"
  >
    <g
      v-if="iconData[name].paths"
      :fill="iconData[name].fill"
      :fill-rule="iconData[name].fillRule"
      :stroke="iconData[name].stroke"
      :stroke-linecap="iconData[name].strokeLinecap"
      :stroke-linejoin="iconData[name].strokeLinejoin"
      :stroke-width="iconData[name].strokeWidth"
    >
      <path v-for="(path, i) in iconData[name].paths" :key="i" :d="path" />
    </g>
    <path v-else fill="currentColor" :d="iconData[name].path" />
  </svg>
</template>

<script setup lang="ts">
import { iconData, type IconName } from "./icons/iconData";

defineProps<{
  name: IconName;
  size?: string | number;
  width?: string | number;
  height?: string | number;
}>();
</script>
