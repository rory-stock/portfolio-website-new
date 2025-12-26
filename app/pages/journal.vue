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

const { content: journal } = await useContentData("journal", true);

const images = computed(() => imageData.value?.images || []);
const selectedImage = ref<(typeof images.value)[0] | null>(null);
</script>

<template>
  <div class="mt-4 md:mt-20">
    <h1
      class="mt-2 ml-3 font-ghost text-xl selection:bg-black selection:text-white md:mt-3 md:ml-0 md:flex md:justify-center md:text-2xl lg:mt-4 lg:text-3xl"
    >
      {{ journal?.subtitle }}
    </h1>

    <div
      class="flex flex-col gap-4 px-4 pt-2 pb-8 md:grid md:grid-cols-3 md:gap-12 md:px-12 md:pt-3 md:pb-0 lg:gap-14 lg:px-28 lg:pt-4 lg:pb-28 xl:grid-cols-4"
    >
      <ImageGridItem
        v-for="image in images"
        :key="image.id"
        :image="image"
        @click="selectedImage = image"
        class="cursor-pointer"
      />
    </div>

    <!-- Lightbox -->
    <ImageLightbox
      :is-open="!!selectedImage"
      :image-path="selectedImage?.r2_path ?? ''"
      :alt="selectedImage?.alt ?? 'Journal Image'"
      :description="selectedImage?.description ?? ''"
      @close="selectedImage = null"
    />
  </div>
</template>
