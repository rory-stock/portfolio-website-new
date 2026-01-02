<script setup lang="ts">
import { getOgImageUrl, getTwitterImageUrl } from "~/utils/meta";
import { groupImagesByLayout } from "~/utils/layouts";
import type { SnapImage } from "~~/types/imageTypes";

useHead({ title: "Overview" });

useSeoMeta({
  ogImage: getOgImageUrl("overview"),
  twitterImage: getTwitterImageUrl("overview"),
});

const { data: imagesData } = await useFetch<{ images: SnapImage[] }>(
  "/api/images?context=overview&include_layouts=true"
);

const images = computed(() => imagesData.value?.images ?? []);
const selectedImage = ref<SnapImage | null>(null);

const sections = computed(() => {
  return groupImagesByLayout(images.value);
});

const { observeHeroSections } = useHeaderTextColour();

onMounted(() => {
  const cleanup = observeHeroSections();
  onUnmounted(cleanup);
});
</script>

<template>
  <div>
    <!-- Desktop: snap scroll sections -->
    <div
      class="fixed inset-0 hidden snap-y snap-mandatory overflow-y-scroll lg:block [&::-webkit-scrollbar]:hidden"
      style="scrollbar-width: none; -ms-overflow-style: none"
    >
      <SnapSection
        v-for="(section, idx) in sections"
        :key="`section-${idx}`"
        :layout-type="section.layoutType"
        :images="section.images"
        @select-image="selectedImage = $event"
      />

      <section class="snap-end">
        <AppFooter />
      </section>
    </div>

    <!-- Mobile: standard vertical column (no snap) -->
    <div class="min-h-fit bg-white md:mt-12 lg:hidden">
      <div class="flex flex-col gap-4 p-4">
        <NuxtPicture
          v-for="image in images"
          :key="image.id"
          :src="image.r2_path"
          :alt="image.alt || ''"
          format="webp"
          :img-attrs="{
            class: 'h-auto w-full cursor-pointer',
          }"
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
      :image-path="selectedImage?.r2_path ?? ''"
      :alt="selectedImage?.alt ?? 'Overview Image'"
      :description="selectedImage?.description ?? ''"
      @close="selectedImage = null"
    />
  </div>
</template>
