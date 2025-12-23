<template>
  <!-- Fullscreen Hero -->
  <section
    v-if="layoutType === 'fullscreen-hero' && images[0]"
    class="snap-section fullscreen-hero-section h-screen snap-start"
  >
    <NuxtPicture
      :src="images[0].r2_path"
      :alt="images[0].alt || ''"
      format="webp"
      quality="100"
      densities="x1 x2"
      :img-attrs="{
        class: 'h-full w-full cursor-pointer object-cover',
        onClick: () => handleImageClick(images[0]!),
      }"
    />
  </section>

  <!-- All other layouts -->
  <section
    v-else-if="images.length > 0"
    class="snap-section flex h-screen snap-start items-center justify-center"
  >
    <!-- Single Hero or Null Layout -->
    <div
      v-if="(layoutType === 'single-hero' || layoutType === null) && images[0]"
      class="w-full max-w-5xl px-4"
    >
      <NuxtPicture
        :src="images[0].r2_path"
        :alt="images[0].alt || ''"
        format="webp"
        densities="x1 x2"
        :img-attrs="{
          class: 'h-auto max-h-[80vh] w-full cursor-pointer object-contain',
          onClick: () => handleImageClick(images[0]!),
        }"
      />
    </div>

    <!-- Dual Horizontal -->
    <div
      v-else-if="layoutType === 'dual-horizontal'"
      class="grid w-full max-w-7xl grid-cols-2 items-center gap-6 px-4"
    >
      <NuxtPicture
        v-for="image in images"
        :key="image.id"
        :src="image.r2_path"
        :alt="image.alt || ''"
        format="webp"
        densities="x1 x2"
        :img-attrs="{
          class: 'h-auto max-h-[70vh] w-full cursor-pointer object-contain',
          onClick: () => handleImageClick(image),
        }"
      />
    </div>

    <!-- Triple Row -->
    <div
      v-else-if="layoutType === 'triple-row'"
      class="grid w-full max-w-fit grid-cols-3 items-center gap-4 px-4"
    >
      <NuxtPicture
        v-for="image in images"
        :key="image.id"
        :src="image.r2_path"
        :alt="image.alt || ''"
        densities="x1 x2"
        format="webp"
        :img-attrs="{
          class: 'h-auto max-h-[60vh] w-full cursor-pointer object-contain',
          onClick: () => handleImageClick(image),
        }"
      />
    </div>

    <!-- Asymmetric Left -->
    <div
      v-else-if="layoutType === 'asymmetric-left' && images[0] && images[1]"
      class="grid w-full max-w-7xl grid-cols-3 gap-6 px-4"
    >
      <div class="col-span-2">
        <NuxtPicture
          :src="images[0].r2_path"
          :alt="images[0].alt || ''"
          format="webp"
          densities="x1 x2"
          :img-attrs="{
            class: 'h-auto max-h-[75vh] w-full cursor-pointer object-contain',
            onClick: () => handleImageClick(images[0]!),
          }"
        />
      </div>
      <div class="col-span-1 flex items-center">
        <NuxtPicture
          :src="images[1].r2_path"
          :alt="images[1].alt || ''"
          format="webp"
          densities="x1 x2"
          :img-attrs="{
            class: 'h-auto max-h-[60vh] w-full cursor-pointer object-contain',
            onClick: () => handleImageClick(images[1]!),
          }"
        />
      </div>
    </div>

    <!-- Asymmetric Right -->
    <div
      v-else-if="layoutType === 'asymmetric-right' && images[0] && images[1]"
      class="grid w-full max-w-7xl grid-cols-3 gap-6 px-4"
    >
      <div class="col-span-1 flex items-center">
        <NuxtPicture
          :src="images[0].r2_path"
          :alt="images[0].alt || ''"
          format="webp"
          densities="x1 x2"
          :img-attrs="{
            class: 'h-auto max-h-[60vh] w-full cursor-pointer object-contain',
            onClick: () => handleImageClick(images[0]!),
          }"
        />
      </div>
      <div class="col-span-2">
        <NuxtPicture
          :src="images[1].r2_path"
          :alt="images[1].alt || ''"
          format="webp"
          densities="x1 x2"
          :img-attrs="{
            class: 'h-auto max-h-[75vh] w-full cursor-pointer object-contain',
            onClick: () => handleImageClick(images[1]!),
          }"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { SnapImage } from "~~/types/imageTypes";
import type { LayoutTypeId } from "~~/types/layoutTypes";

interface Props {
  layoutType: LayoutTypeId | null;
  images: SnapImage[];
}

defineProps<Props>();

const emit = defineEmits<{
  "select-image": [image: SnapImage];
}>();

function handleImageClick(image: SnapImage) {
  emit("select-image", image);
}
</script>
