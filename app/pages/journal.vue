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

const images = computed(() => imageData.value?.images || []);
const selectedImage = ref<(typeof images.value)[0] | null>(null);
</script>

<template>
  <div>
    <h1
      class="mt-2 ml-3 font-neue-montreal-medium-semi text-2xl selection:bg-black selection:text-white md:mt-3 md:ml-5 md:text-3xl lg:mt-4 lg:ml-8 lg:text-4xl"
    >
      {{ journal?.subtitle }}
    </h1>

    <!-- Mobile: Single column -->
    <div class="flex flex-col gap-4 p-4 md:hidden">
      <ImageGridItem
        v-for="image in images"
        :key="image.id"
        :image="image"
        @click="selectedImage = image"
      />
    </div>

    <!-- Desktop: grid layout -->
    <div
      class="hidden grid-cols-3 gap-12 px-12 pt-4 md:grid lg:gap-14 lg:px-28 lg:pt-8 lg:pb-28 xl:grid-cols-4"
    >
      <ImageGridItem
        v-for="image in images"
        :key="image.id"
        :image="image"
        @click="selectedImage = image"
      />
    </div>

    <!-- Lightbox -->
    <ImageLightbox
      :is-open="!!selectedImage"
      :image-path="selectedImage?.r2_path ?? ''"
      :alt="selectedImage?.alt ?? 'Journal Image'"
      @close="selectedImage = null"
    />
  </div>
</template>
