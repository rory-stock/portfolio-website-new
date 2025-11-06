<script setup lang="ts">
definePageMeta({
  middleware: ["authenticated"],
  layout: "admin",
});

useHead({ title: "Admin" });
</script>

<template>
  <div class="text-neutral-100">Page: admin</div>
</template>
