<script setup lang="ts">
const props = defineProps<{
  suggestedPage: string;
  isDark?: boolean;
}>();

const textColorClass = computed(() =>
  props.isDark ? "text-neutral-400" : "text-neutral-900"
);
</script>

<template>
  <div class="recovery-hint font-ibm-plex-sans">
    <p :class="textColorClass">
      Did you mean
      <NuxtLink
        :to="suggestedPage"
        class="font-medium underline transition-colors duration-300 hover:opacity-70"
        :class="textColorClass"
      >
        {{ suggestedPage }}
      </NuxtLink>
    </p>
  </div>
</template>
