<script setup lang="ts">
useHead({ title: "Overview" });

useSeoMeta({
  ogImage:
    "https://images.rorystock.com/cdn-cgi/image/w=1200,h=630/meta/overview-og-image.jpg",
  twitterImage:
    "https://images.rorystock.com/cdn-cgi/image/w=1200,h=675/meta/overview-twitter-image.jpg",
});

const { data: imageData } = await useFetch("/api/images", {
  query: { context: "overview" },
});

const images = computed(() => imageData.value?.images || []);
const selectedImage = ref<(typeof images.value)[0] | null>(null);
</script>

<template>
  <div>
    <div
      class="flex flex-col gap-8 px-4 pt-8 pb-4 md:gap-12 md:px-12 md:pb-12 lg:grid lg:grid-cols-3 lg:gap-x-20 lg:gap-y-12 lg:px-28"
    >
      <ImageGridItem
        v-for="image in images"
        :key="image.id"
        :image="image"
        @click="selectedImage = image"
        class="cursor-pointer"
      />
    </div>

    <ImageLightbox
      :is-open="!!selectedImage"
      :image-path="selectedImage?.r2_path ?? ''"
      :alt="selectedImage?.alt ?? 'Journal Image'"
      :description="selectedImage?.description ?? ''"
      @close="selectedImage = null"
    />
  </div>
</template>

<style scoped></style>
