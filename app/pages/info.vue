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
      class="mx-auto px-3 pt-3 md:min-w-1/3 lg:mx-0 lg:min-w-1/4 lg:pt-4 lg:pl-4"
    >
      <NuxtPicture
        v-if="image"
        :src="`/rebuild/${image.path}`"
        :alt="image.alt"
        class="grayscale"
      />
    </div>

    <!-- Contact Info -->
    <div v-if="info" class="mx-auto px-3 py-3 md:mx-0 md:py-2 lg:mx-0 lg:pt-6">
      <h2
        class="font-neue-display text-2xl font-semibold md:text-3xl lg:text-4xl"
      >
        {{ info.contactHeader }}
      </h2>

      <p class="font-neue-text md:text-xl lg:text-3xl">
        {{ info.contactCta }}
        <a
          class="underline transition-opacity duration-100 hover:opacity-80 lg:font-georgia"
          :href="`mailto:${info.contactEmail}`"
          >{{ info.contactEmail }}</a
        >
      </p>

      <p
        class="mt-3 font-neue-text text-sm md:text-lg lg:mt-6 lg:mr-20 lg:text-2xl"
      >
        {{ info.bio }}
      </p>
    </div>
  </div>
</template>
