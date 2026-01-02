<script setup lang="ts">
import { getOgImageUrl, getTwitterImageUrl } from "~/utils/meta";

useHead({ title: "Info" });

useSeoMeta({
  ogImage: getOgImageUrl("info"),
  twitterImage: getTwitterImageUrl("info"),
});

const { data: imageData } = await useFetch("/api/images", {
  query: { context: "info", is_primary: true },
});

const image = computed(() => {
  if (!imageData.value?.images) return null;
  return Array.isArray(imageData.value.images)
    ? imageData.value.images.find((img: any) => img.is_primary)
    : imageData.value.images;
});

const imagePath = computed(() => image.value?.r2_path);

const { data: info } = await useContentData("info");
</script>

<template>
  <div class="md:mt-20 md:ml-10 md:flex md:flex-1 md:grow md:justify-start">
    <!-- Profile Image -->
    <div
      class="mx-3 w-full flex-1 pt-3 grayscale md:max-w-80 lg:mx-0 lg:max-w-80 lg:pt-4 lg:pl-4 xl:max-w-[20rem]"
    >
      <NuxtPicture
        v-if="image && imagePath"
        :src="imagePath"
        :alt="image.alt ?? 'Profile Image'"
        class="object-cover"
      />
    </div>

    <!-- Contact Info -->
    <div
      v-if="info"
      class="w-fit px-3 py-3 selection:bg-black selection:text-white md:mx-0 md:flex-1 md:shrink md:py-2 lg:mx-6 lg:pt-6"
    >
      <h2
        class="font-neue-montreal-medium-semi text-2xl md:text-2xl lg:text-3xl xl:text-4xl"
      >
        {{ info.contactHeader }}
      </h2>

      <p class="pt-1 font-ghost md:text-xl lg:text-2xl">
        {{ info.contactCta }}
        <a
          class="underline transition-opacity duration-100 hover:opacity-70"
          :href="`mailto:${info.contactEmail}`"
          >{{ info.contactEmail }}</a
        >
      </p>

      <p class="mt-3 font-ghost md:text-lg lg:mt-6 lg:mr-20 lg:text-2xl">
        {{ info.bio }}
      </p>
    </div>
  </div>
</template>
