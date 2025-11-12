<template>
  <div class="mx-auto mt-6 max-w-6xl space-y-8 p-6">
    <h1 class="text-3xl font-bold text-white">Overview Page Admin</h1>
    <div>
<!--      <ContentSection table="journal" title="Journal" :fields="contentFields" />-->
<!--      <hr class="my-4" />-->
      <ImageSection context="overview" title="Overview" />
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

// const contentFields = [
//   {
//     key: "subtitle",
//     label: "Subtitle",
//     type: "text" as const,
//   },
// ];
</script>
