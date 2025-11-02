<script setup lang="ts">
useHead({
  title: "Info",
});

const { data: image } = await useAsyncData("profile-image", () =>
  queryCollection("images").first()
);

const { data: info } = await useAsyncData("contact-info", () =>
  queryCollection("contactInfo").first()
);
</script>

<template>
  <div class="w-full max-w-3xs" :style="{ aspectRatio: '4098 / 5464' }">
    <NuxtImg
      v-if="image"
      :src="`/r2/${image.path}`"
      :alt="image.alt"
      class="h-full w-full object-cover grayscale"
      quality="10"
    />
  </div>
  <div v-if="info">
    <h2>{{ info.contactHeader }}</h2>
    <p>
      {{ info.contactCta }}
      <a :href="`mailto:${info.contactEmail}`">{{ info.contactEmail }}</a>
    </p>
    <p>{{ info.bio }}</p>
  </div>
</template>

<style scoped></style>
