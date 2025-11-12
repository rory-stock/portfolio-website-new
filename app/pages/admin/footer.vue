<template>
  <div class="mx-auto max-w-6xl space-y-4 md:space-y-8 p-6 md:mt-6">
    <h1 class="text-2xl font-bold text-white md:text-3xl">Footer Admin</h1>
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
