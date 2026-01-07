<script setup lang="ts">
const props = defineProps<{
  suggestedPage: string;
}>();
</script>

<template>
  <div class="recovery-hint font-ghost text-neutral-980 xl:text-2xl">
    <p>
      Did you mean
      <NuxtLink
        :to="suggestedPage"
        class="underline transition-colors duration-300 hover:opacity-70"
      >
        {{ suggestedPage }}
      </NuxtLink>
    </p>
  </div>
</template>
