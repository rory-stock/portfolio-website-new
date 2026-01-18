<script setup lang="ts">
import { getOgImageUrl, getTwitterImageUrl } from "~/utils/meta";
import type { EventWithImagesResponse } from "~~/types/api";

useHead({
  title: "Events",
});

definePageMeta({
  layout: "events",
});

useSeoMeta({
  ogImage: getOgImageUrl("events"),
  twitterImage: getTwitterImageUrl("events"),
});

const { data: eventsData } = await useFetch<{
  events: EventWithImagesResponse[];
  total: number;
}>("/api/events");

const { data: contentData } = await useContentData("events");

const events = computed(() => eventsData.value?.events || []);

const eventURL = (slug: string) => {
  return `/events/${slug}`;
};
</script>

<template>
  <div class="md:mt-20">
    <h1
      class="mx-4 my-2 flex justify-center font-ghost text-base text-neutral-500 selection:bg-black selection:text-neutral-100 md:mt-3 md:text-lg lg:mt-4 lg:text-xl"
    >
      {{ contentData?.subheader }}
    </h1>

    <div
      class="flex flex-col gap-8 px-8 pt-2 pb-4 md:gap-12 md:px-20 md:pb-12 lg:grid lg:grid-cols-2 lg:gap-x-24 lg:gap-y-12 lg:px-28"
    >
      <NuxtLink
        v-for="event in events"
        :to="eventURL(event.slug)"
        :key="event.id"
        class="group flex flex-col"
      >
        <div v-if="event.cover_image">
          <ImageGridItem
            :key="event.id"
            :image="event.cover_image"
            class="peer cursor-pointer"
          />
          <div
            class="mt-1 flex font-ghost text-base group-hover:font-ghost-italic md:text-xl lg:mt-2"
          >
            <p>{{ event.name }}</p>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
