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
      <p class="mt-3 font-ghost text-xl text-black lg:text-2xl">
        Looking for your gallery?
      </p>
      <NuxtLink
        to="/info"
        class="mt-2 inline-block font-ghost text-lg lg:text-xl text-neutral-500 underline transition-colors hover:text-black"
      >
        Get in touch for access
      </NuxtLink>
    </div>
  </div>
</template>
