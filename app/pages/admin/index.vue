<template>
  <div class="mx-auto max-w-6xl space-y-4 p-6 md:mt-6 md:space-y-8">
    <h1 class="text-2xl font-bold text-white md:text-3xl">
      Overview Page Admin
    </h1>
    <ImageSection context="overview" title="Overview" :fields="imageFields" :show-layout-wizard="true" />
    <Toast />
  </div>
</template>

<script setup lang="ts">
import type { ImageField } from "~~/types/imageTypes";

const { fetch: refreshSession } = useUserSession();

onMounted(async () => {
  await refreshSession();
});

definePageMeta({
  middleware: "authenticated",
  layout: "admin",
});

useHead({ title: "Admin" });

const imageFields: ImageField[] = [
  {
    key: "alt",
    label: "Alt Text",
    type: "text" as const,
    placeholder: "Image Alt Text",
  },
];
</script>
