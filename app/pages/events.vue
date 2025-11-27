<script setup lang="ts">
useHead({
  title: "Events",
});

useSeoMeta({
  // TODO: Update OG images for events page
  ogImage:
    "https://images.rorystock.com/cdn-cgi/image/w=1200,h=630/meta/journal-og-image.jpg",
  twitterImage:
    "https://images.rorystock.com/cdn-cgi/image/w=1200,h=675/meta/journal-twitter-image.jpg",
});

const { data: imageData } = await useFetch("/api/images", {
  query: { context: "events" },
});

const { data: event } = await useFetch("/api/content", {
  query: { table: "events" },
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

const images = computed(() => imageData.value?.images || []);
</script>

<template>
  <div>
    <h1
      class="mx-4 my-2 flex justify-center font-ghost text-base text-neutral-500 selection:bg-black selection:text-neutral-100 md:mt-3 md:text-lg lg:mt-4 lg:text-xl"
    >
      {{ event?.subheader }}
    </h1>

    <!-- Mobile: Single column -->
    <div class="flex flex-col gap-4 p-4 md:hidden">
      <ImageGridItem
        v-for="image in images"
        :key="image.id"
        :image="image"
      />
    </div>

    <!-- Desktop: grid layout -->
    <div
      class="hidden grid-cols-3 gap-12 px-12 pt-4 md:grid lg:gap-6 lg:px-28 lg:pt-8 lg:pb-28 xl:grid-cols-2"
    >
      <ImageGridItem
        v-for="image in images"
        :key="image.id"
        :image="image"
      />
    </div>
  </div>
</template>

<style scoped></style>
