<script setup lang="ts">
import { groupImagesByLayout } from "~~/types/layoutTypes";
import type { SnapImage } from "~~/types/imageTypes";

useHead({ title: "Overview" });

useSeoMeta({
  ogImage:
    "https://images.rorystock.com/cdn-cgi/image/w=1200,h=630/meta/overview-og-image.jpg",
  twitterImage:
    "https://images.rorystock.com/cdn-cgi/image/w=1200,h=675/meta/overview-twitter-image.jpg",
});

// Mock data for development
const mockImages: SnapImage[] = [
  // Section 0: Fullscreen hero
  {
    id: 0,
    url: "https://placehold.co/1920x1080",
    alt: "Fullscreen hero",
    layout_type: "fullscreen-hero",
  },
  // Section 1: Single hero
  {
    id: 1,
    url: "https://placehold.co/1200x800",
    alt: "Hero image",
    layout_type: "single-hero",
  },
  // Section 2: Dual horizontal
  {
    id: 2,
    url: "https://placehold.co/800x1200",
    alt: "Portrait 1",
    layout_type: "dual-horizontal",
  },
  {
    id: 3,
    url: "https://placehold.co/1200x800",
    alt: "Landscape 1",
    layout_type: "dual-horizontal",
  },
  // Section 3: Triple row
  {
    id: 4,
    url: "https://placehold.co/800x800",
    alt: "Square 1",
    layout_type: "triple-row",
  },
  {
    id: 5,
    url: "https://placehold.co/1200x800",
    alt: "Landscape 2",
    layout_type: "triple-row",
  },
  {
    id: 6,
    url: "https://placehold.co/800x1200",
    alt: "Portrait 2",
    layout_type: "triple-row",
  },
  // Section 4: Asymmetric left
  {
    id: 7,
    url: "https://placehold.co/1200x1600",
    alt: "Large portrait",
    layout_type: "asymmetric-left",
  },
  {
    id: 8,
    url: "https://placehold.co/800x600",
    alt: "Small landscape",
    layout_type: "asymmetric-left",
  },
  // Section 5: Asymmetric right
  {
    id: 9,
    url: "https://placehold.co/800x1000",
    alt: "Small portrait",
    layout_type: "asymmetric-right",
  },
  {
    id: 10,
    url: "https://placehold.co/1400x900",
    alt: "Large landscape",
    layout_type: "asymmetric-right",
  },
];

const selectedImage = ref<SnapImage | null>(null);

// Group images by layout type
const sections = computed(() => {
  return groupImagesByLayout(mockImages);
});
</script>

<template>
  <div>
    <!-- Desktop: snap scroll sections -->
    <div class="hidden h-screen snap``~-y snap-mandatory overflow-y-auto lg:block">
      <SnapSection
        v-for="(section, idx) in sections"
        :key="`section-${idx}`"
        :layout-type="section.layoutType"
        :images="section.images"
        @select-image="selectedImage = $event"
      />
      <AppFooter class="snap-end" />
    </div>

    <!-- Mobile: standard vertical column (no snap) -->
    <div class="min-h-fit bg-white md:mt-12 lg:hidden">
      <div class="flex flex-col gap-4 p-4">
        <img
          v-for="image in mockImages"
          :key="image.id"
          :src="image.url"
          :alt="image.alt || ''"
          class="h-auto w-full cursor-pointer"
          @click="selectedImage = image"
        />
      </div>
      <ClientOnly>
        <AppFooter />
      </ClientOnly>
    </div>

    <!-- Lightbox -->
    <ImageLightbox
      :is-open="!!selectedImage"
      :image-path="selectedImage?.r2_path ?? selectedImage?.url ?? ''"
      :alt="selectedImage?.alt ?? 'Journal Image'"
      :description="selectedImage?.description ?? ''"
      @close="selectedImage = null"
    />
  </div>
</template>
