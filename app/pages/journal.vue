<script setup lang="ts">
useHead({
  title: "Journal",
});

useSeoMeta({
  ogImage:
    "https://images.rorystock.com/cdn-cgi/image/w=1200,h=630/meta/journal-og-image.jpg",
  twitterImage:
    "https://images.rorystock.com/cdn-cgi/image/w=1200,h=675/meta/journal-twitter-image.jpg",
});

const { data: imageData } = await useFetch("/api/images", {
  query: { context: "journal" },
});

const { data: journal } = await useFetch("/api/content", {
  query: { table: "journal" },
  transform: (data: any[]) => {
    if (!Array.isArray(data)) return {};
    return data.reduce(
      (acc, item) => {
        acc[item.key] = item.value;
        return acc;
      },
      {} as Record<string, string>
    );
  },
});
</script>

<template>
  <div>
    <h1
      class="m-2 ml-3 font-neue-montreal-medium-semi text-2xl selection:bg-black selection:text-white md:m-3 md:ml-5 md:text-3xl lg:m-4 lg:ml-8 lg:text-4xl"
    >
      {{ journal?.subtitle }}
    </h1>
  </div>
</template>

<style scoped></style>
