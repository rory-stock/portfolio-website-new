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
import { FIELD_SETS } from "~~/types/imageFields";

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

const imageFields = FIELD_SETS.events;
</script>
