<template>
  <div class="mx-auto mt-6 max-w-6xl space-y-8  p-6">
    <h1 class="text-3xl font-bold text-white">Footer Admin</h1>
    <div>
      <ContentSection table="footer" title="Footer" :fields="contentFields" />
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
    key: "email",
    label: "Email",
    type: "email" as const,
  },
  {
    key: "instagram",
    label: "Instagram",
    type: "text" as const,
  },
  {
    key: "location",
    label: "Location",
    type: "text" as const,
  },
  {
    key: "copyright",
    label: "Copyright",
    type: "text" as const,
  },
];
</script>
