<script setup lang="ts">
useHead({
  title: "Events",
});

useSeoMeta({
  // TODO: Update OG images for events page
  ogImage:
    "https://images.rorystock.com/cdn-cgi/image/w=1200,h=630/meta/journal-og-image.jpg",
  twitterImage:
    "https://images.rorystock.com/cdn-cgi/image/w=1200,h=675/meta/journal-twitter-image.jpg",
});

const { data: imageData } = await useFetch("/api/images", {
  query: { context: "events" },
});

const { data: event } = await useContentData("events");

const images = computed(() => imageData.value?.images || []);

const eventURL = (eventName: string | null) => {
  if (!eventName) return "/#";
  return `/events/${encodeURIComponent(
    eventName.toLowerCase().replace(/\s+/g, "-")
  )}`;
};
</script>

<template>
  <div class="md:mt-20">
    <h1
      class="mx-4 my-2 flex justify-center font-ghost text-base text-neutral-500 selection:bg-black selection:text-neutral-100 md:mt-3 md:text-lg lg:mt-4 lg:text-xl"
    >
      {{ event?.subheader }}
    </h1>

    <div
      class="flex flex-col gap-8 px-8 pt-2 pb-4 md:gap-12 md:px-20 md:pb-12 lg:grid lg:grid-cols-2 lg:gap-x-24 lg:gap-y-12 lg:px-28"
    >
      <NuxtLink
        v-for="image in images"
        :to="eventURL(image.event_name)"
        :key="image.id"
        class="group flex flex-col"
      >
        <ImageGridItem
          :key="image.id"
          :image="image"
          class="peer cursor-pointer"
        />
        <div
          class="mt-1 flex font-ghost text-base group-hover:font-ghost-italic md:text-xl lg:mt-2"
        >
          <p>{{ image.event_name }}</p>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
