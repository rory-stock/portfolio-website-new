<script setup lang="ts">
definePageMeta({
  layout: "default",
});

useHead({
  title: "Gallery",
});
</script>

<template>
  <div class="flex min-h-[60vh] items-center justify-center md:mt-20">
    <div class="text-center selection:bg-black selection:text-white">
      <h1 class="font-ghost text-3xl text-black md:text-4xl">
        Client Galleries
      </h1>
      <p class="mt-3 font-ghost text-lg text-neutral-500 md:text-xl">
        Looking for your gallery?
      </p>
      <NuxtLink
        to="/info"
        class="mt-2 inline-block font-ghost text-lg text-neutral-500 underline transition-colors hover:text-black"
      >
        Get in touch for access
      </NuxtLink>
    </div>
  </div>
</template>
