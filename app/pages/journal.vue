<script setup lang="ts">
useHead({
  title: "Journal",
});

const { data: journalEntries } = await useAsyncData("journal", () =>
  queryCollectionItems("images")
    .where("type", "journal")
    .where("publishedAt", { $lte: new Date().toISOString() }) // only show published
    .sort({ publishedAt: -1 }) // newest first
    .all()
);
</script>

<template>
  <div>Page: Journal</div>
</template>

<style scoped></style>
