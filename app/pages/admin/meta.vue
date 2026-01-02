<template>
  <div class="mx-auto max-w-6xl space-y-4 p-6 md:mt-6 md:space-y-8">
    <h1 class="text-2xl font-bold text-white md:text-3xl">
      Meta Admin
    </h1>

    <MetaImagesSection />

    <ContentSection table="footer" title="Footer" :fields="contentFields" />

    <Toast />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "authenticated",
  layout: "admin",
});

useHead({ title: "Meta Admin" });

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
