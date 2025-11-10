<template>
  <div class="mx-auto max-w-6xl space-y-8 p-6">
    <h1 class="text-3xl font-bold">Info Page Admin</h1>
    <ContentSection table="info" title="Content" :fields="contentFields" />

    <ImageSection context="info" title="Images" />

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
  // Add more fields as needed for your info table
];
</script>
