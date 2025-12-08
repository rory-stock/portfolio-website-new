<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter v-if="!isIndexRoute" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute();

const isIndexRoute = computed(() => route.name === "index");
</script>
