<template>
  <div class="mx-auto max-w-6xl space-y-4 p-6 md:mt-6 md:space-y-8">
    <h1 class="text-2xl font-bold text-white md:text-3xl">
      Overview Page Admin
    </h1>
    <div>
      <!--      <ContentSection table="overview" title="Overview" :fields="contentFields" />-->
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
