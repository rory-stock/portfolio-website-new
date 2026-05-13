<script setup lang="ts">
import type { DisplayImage } from "~~/types/imageTypes";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

const route = useRoute();

interface SubFolder {
  id: number;
  name: string;
  slug: string;
  images: DisplayImage[];
}

interface PublicGalleryData {
  id: number;
  sub_folders?: SubFolder[];
  images?: DisplayImage[];
}

const galleryData = inject<Ref<PublicGalleryData | null>>("publicGalleryData");
const subFolders = inject<Ref<SubFolder[]>>("publicSubFolders");

const activeSubSlug = computed(() => (route.params.subSlug as string) || null);
const hasSubFolders = computed(() => (subFolders?.value?.length ?? 0) > 0);

// Find active subfolder
const activeSubFolder = computed(() => {
  if (!activeSubSlug.value || !subFolders?.value) return null;
  return subFolders.value.find((s) => s.slug === activeSubSlug.value) ?? null;
});

// Determine which images to display
const displayImages = computed(() => {
  if (activeSubFolder.value) {
    return activeSubFolder.value.images;
  }

  if (!activeSubSlug.value && !hasSubFolders.value) {
    return galleryData?.value?.images ?? [];
  }

  return [];
});

const isNotFound = computed(
  () => activeSubSlug.value && !activeSubFolder.value && hasSubFolders.value
);

const isEmpty = computed(
  () => !isNotFound.value && displayImages.value.length === 0
);

const { isMobile, isTablet } = useResponsive();

const columns = computed(() => {
  if (isMobile.value) return 1;
  if (isTablet.value) return 2;
  return 3;
});

// Lightbox
const selectedImage = ref<DisplayImage | null>(null);
</script>

<template>
  <div>
    <!-- Subfolder not found -->
    <div
      v-if="isNotFound"
      class="py-16 text-center selection:bg-black selection:text-white"
    >
      <p class="font-ghost text-2xl text-black">Page not found</p>
      <NuxtLink
        :to="`/gallery/${route.params.slug}`"
        class="mt-3 inline-block font-ghost text-xl text-neutral-500 underline hover:text-black"
      >
        ← Back to gallery
      </NuxtLink>
    </div>

    <!-- No images -->
    <div v-else-if="isEmpty" class="py-16 text-center">
      <p
        class="font-ghost text-lg text-black selection:bg-black selection:text-white md:text-xl lg:text-2xl"
      >
        Nothing here yet — check back soon
      </p>
    </div>

    <!-- Image grid -->
    <template v-else>
      <ClientOnly>
        <MasonryImageGrid
          :images="displayImages"
          :max-columns="columns"
          :min-columns="columns"
          :column-width="isMobile ? 1 : isTablet ? 2 : 3"
          :gap="8"
          :show-download="true"
          @image-click="selectedImage = $event"
        />
        <template #fallback>
          <div class="py-12 text-center text-neutral-400">
            Loading images...
          </div>
        </template>
      </ClientOnly>

      <!-- Lightbox -->
      <ImageLightbox
        :is-open="!!selectedImage"
        :image-path="selectedImage?.r2_path ?? selectedImage?.url ?? ''"
        :alt="selectedImage?.alt ?? 'Gallery Image'"
        :description="selectedImage?.description ?? ''"
        :show-download="true"
        :image-instance-id="selectedImage?.instanceId ?? null"
        :image-context="selectedImage?.context ?? ''"
        @close="selectedImage = null"
      />
    </template>
  </div>
</template>
