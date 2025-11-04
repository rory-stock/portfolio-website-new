<script setup lang="ts">
useHead({ title: "Overview" });

const { data: home } = await useAsyncData(() =>
  queryCollection("content").path("/").first()
);
</script>

<template>
  <div>
    Page: Journal
  </div>
</template>

<style scoped></style>
