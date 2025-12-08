<template>
  <section v-if="layoutType && images.length > 0" :class="sectionClasses">
    <!-- Fullscreen Hero -->
    <NuxtPicture
      v-if="layoutType === 'fullscreen-hero' && images[0]"
      :src="images[0].url"
      :alt="images[0].alt || ''"
      format="webp"
      densities="x1 x2"
      :img-attrs="{
        class: 'h-full w-full cursor-pointer object-cover',
        onClick: () => handleImageClick(images[0]!),
      }"
    />

    <!-- All other layouts -->
    <div v-else :class="containerClasses">
      <!-- Single Hero -->
      <NuxtPicture
        v-if="layoutType === 'single-hero' && images[0]"
        :src="images[0].url"
        :alt="images[0].alt || ''"
        format="webp"
        densities="x1 x2"
        sizes="xs:100vw sm:90vw md:80vw lg:1024px"
        :img-attrs="{
          class: 'h-auto max-h-[80vh] w-full cursor-pointer object-contain',
          onClick: () => handleImageClick(images[0]!),
        }"
      />

      <!-- Dual/Triple -->
      <NuxtPicture
        v-else-if="isDualOrTriple"
        v-for="image in images"
        :key="image.id"
        :src="image.url"
        :alt="image.alt || ''"
        format="webp"
        densities="x1 x2"
        :sizes="
          layoutType === 'dual-horizontal'
            ? 'xs:100vw md:50vw'
            : 'xs:100vw md:33vw'
        "
        :img-attrs="{
          class: getImageClasses(layoutType),
          onClick: () => handleImageClick(image),
        }"
      />

      <!-- Asymmetric Layouts -->
      <template v-else-if="images[0] && images[1]">
        <div :class="getAsymmetricWrapperClasses(0)">
          <NuxtPicture
            :src="images[0].url"
            :alt="images[0].alt || ''"
            format="webp"
            densities="x1 x2"
            :sizes="isAsymmetricLeft ? 'xs:100vw md:66vw' : 'xs:100vw md:33vw'"
            :img-attrs="{
              class: getAsymmetricImageClasses(0),
              onClick: () => handleImageClick(images[0]!),
            }"
          />
        </div>
        <div :class="getAsymmetricWrapperClasses(1)">
          <NuxtPicture
            :src="images[1].url"
            :alt="images[1].alt || ''"
            format="webp"
            densities="x1 x2"
            :sizes="isAsymmetricLeft ? 'xs:100vw md:33vw' : 'xs:100vw md:66vw'"
            :img-attrs="{
              class: getAsymmetricImageClasses(1),
              onClick: () => handleImageClick(images[1]!),
            }"
          />
        </div>
      </template>
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

const props = defineProps<Props>();

const emit = defineEmits<{
  "select-image": [image: SnapImage];
}>();

const isAsymmetricLeft = computed(() => props.layoutType === "asymmetric-left");

const isDualOrTriple = computed(
  () =>
    props.layoutType === "dual-horizontal" || props.layoutType === "triple-row"
);

const sectionClasses = computed(() => [
  "snap-start",
  props.layoutType === "fullscreen-hero"
    ? "h-screen"
    : "flex h-screen items-center justify-center",
]);

const containerClasses = computed(() => {
  const classes = ["w-full px-4"];

  switch (props.layoutType) {
    case "single-hero":
      classes.push("max-w-5xl");
      break;
    case "dual-horizontal":
      classes.push("max-w-7xl grid grid-cols-2 items-center gap-6");
      break;
    case "triple-row":
      classes.push("max-w-7xl grid grid-cols-3 items-center gap-4");
      break;
    case "asymmetric-left":
    case "asymmetric-right":
      classes.push("max-w-7xl grid grid-cols-3 gap-6");
      break;
  }

  return classes;
});

function getImageClasses(layoutType: LayoutTypeId | null): string {
  const baseClasses = "h-auto w-full cursor-pointer object-contain";
  const maxHeight =
    layoutType === "dual-horizontal" ? "max-h-[70vh]" : "max-h-[60vh]";
  return `${baseClasses} ${maxHeight}`;
}

function getAsymmetricWrapperClasses(index: number): string {
  if (index === 0) {
    return isAsymmetricLeft.value
      ? "col-span-2"
      : "col-span-1 flex items-center";
  }
  return isAsymmetricLeft.value ? "col-span-1 flex items-center" : "col-span-2";
}

function getAsymmetricImageClasses(index: number): string {
  const baseClasses = "h-auto w-full cursor-pointer object-contain";
  let maxHeight = "max-h-[60vh]";

  if (
    (index === 0 && isAsymmetricLeft.value) ||
    (index === 1 && !isAsymmetricLeft.value)
  ) {
    maxHeight = "max-h-[75vh]";
  }

  return `${baseClasses} ${maxHeight}`;
}

function handleImageClick(image: SnapImage) {
  emit("select-image", image);
}
</script>
