<template>
  <div class="mx-auto max-w-6xl space-y-4 p-6 md:mt-6 md:space-y-8">
    <h1 class="text-2xl font-bold text-white md:text-3xl">Info Page Admin</h1>
    <div>
      <ContentSection table="info" title="Content" :fields="contentFields" />
      <hr class="my-4" />
      <ImageSection
        context="info"
        title="Images"
        :fields="[
          {
            key: 'alt',
            label: 'Alt Text',
            type: 'text' as const,
            placeholder: 'Image Alt Text',
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
    key: "contactHeader",
    label: "Contact Header",
    type: "text" as const,
  },
  {
    key: "contactCta",
    label: "Contact CTA",
    type: "text" as const,
  },
  {
    key: "bio",
    label: "Bio",
    type: "textarea" as const,
    rows: 8,
  },
  {
    key: "contactEmail",
    label: "Email",
    type: "email" as const,
  },
];
</script>
