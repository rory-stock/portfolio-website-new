<template>
  <div class="mx-auto mt-6 max-w-6xl space-y-8  p-6">
    <h1 class="text-3xl font-bold text-white">Info Page Admin</h1>
    <div>
      <ContentSection table="info" title="Content" :fields="contentFields" />
      <hr class="my-4" />
      <ImageSection context="info" title="Images" />
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
