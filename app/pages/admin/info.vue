<template>
  <div class="mx-auto max-w-6xl space-y-4 p-6 md:mt-6 md:space-y-8">
    <h1 class="text-2xl font-bold text-white md:text-3xl">Info Page Admin</h1>
    <div>
      <ContentSection table="info" title="Info" :fields="contentFields" />
      <hr class="my-4" />
      <ImageSection
        context="info"
        title="Info"
        :showPrimaryToggle="true"
        :fields="imageFields"
      />
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

const imageFields = FIELD_SETS.basic;
</script>
