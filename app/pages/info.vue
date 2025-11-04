<script setup lang="ts">
useHead({ title: "Info" });

const { data: image } = await useAsyncData("profile-image", () =>
  queryCollection("images").first()
);

const { data: info } = await useAsyncData("contact-info", () =>
  queryCollection("contactInfo").first()
);
</script>

<template>
  <div class="md:flex">
    <!-- Profile Image -->
    <div
      class=" pt-3 w-fit mx-3 lg:mx-0 lg:pt-4 lg:pl-4"
    >
      <NuxtPicture
        v-if="image"
        :src="`/rebuild/${image.path}`"
        :alt="image.alt"
        class="grayscale h-auto"
      />
    </div>

    <!-- Contact Info -->
    <div v-if="info" class=" selection:bg-black selection:text-white px-3 py-3 md:mx-0 md:py-2 lg:mx-6 lg:pt-6">
      <h2
        class="font-neue-montreal-medium-semi text-2xl md:text-2xl lg:text-3xl xl:text-4xl"
      >
        {{ info.contactHeader }}
      </h2>

      <p class="pt-1 font-ghost-regular md:text-xl lg:text-2xl">
        {{ info.contactCta }}
        <a
          class="underline transition-opacity duration-100 hover:opacity-70"
          :href="`mailto:${info.contactEmail}`"
          >{{ info.contactEmail }}</a
        >
      </p>

      <p
        class="mt-3 font-ghost-regular md:text-lg lg:mt-6 lg:mr-20 lg:text-2xl"
      >
        {{ info.bio }}
      </p>
    </div>
  </div>
</template>
