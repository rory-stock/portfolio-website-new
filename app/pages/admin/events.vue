<template>
  <div class="mx-auto max-w-6xl space-y-4 p-6 md:mt-6 md:space-y-8">
    <h1 class="text-2xl font-bold text-white md:text-3xl">Events Page Admin</h1>
    <div>
      <ContentSection table="events" title="Events" :fields="contentFields" />
      <hr class="my-4" />
      <ImageSection context="events" title="Events" :fields="imageFields" />
    </div>
    <Toast />
  </div>
</template>

<script setup lang="ts">
import type { ImageField } from "~~/types/imageTypes";

definePageMeta({
  middleware: "authenticated",
  layout: "admin",
});

useHead({ title: "Admin" });

const contentFields = [
  {
    key: "subheader",
    label: "Subheader",
    type: "text" as const,
  },
];

const imageFields: ImageField[] = [
  {
    key: "alt",
    label: "Alt Text",
    type: "text" as const,
    placeholder: "Image Alt Text",
  },
  {
    key: "event_name",
    label: "Event Name",
    type: "text" as const,
    placeholder: "Event Name",
  },
  {
    key: "event_date",
    label: "Event Date",
    type: "text" as const,
    placeholder: "Event Date",
  },
  {
    key: "event_location",
    label: "Event Location",
    type: "text" as const,
    placeholder: "Event Location",
  },
];
</script>

<style scoped></style>
