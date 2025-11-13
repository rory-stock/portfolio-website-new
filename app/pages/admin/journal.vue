<template>
  <div class="mx-auto max-w-6xl space-y-4 p-6 md:mt-6 md:space-y-8">
    <h1 class="text-2xl font-bold text-white md:text-3xl">
      Journal Page Admin
    </h1>
    <div>
      <ContentSection table="journal" title="Journal" :fields="contentFields" />
      <hr class="my-4" />
      <ImageSection
        context="journal"
        title="Journal"
        :fields="[
          {
            key: 'alt',
            label: 'Alt Text',
            type: 'text' as const,
            placeholder: 'Image Alt Text',
          },
          {
            key: 'description',
            label: 'Description',
            type: 'text' as const,
            placeholder: 'Image Description',
          },
        ]"
      />
    </div>
    <Toast />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "authenticated",
  layout: "admin",
});

useHead({ title: "Admin" });

const contentFields = [
  {
    key: "subtitle",
    label: "Subtitle",
    type: "text" as const,
  },
];
</script>
