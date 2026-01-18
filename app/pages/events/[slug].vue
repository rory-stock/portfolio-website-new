<script setup lang="ts">
import { getOgImageUrl, getTwitterImageUrl } from "~/utils/meta";
import type { EventWithImagesResponse } from "~~/types/api";

definePageMeta({
  layout: "events",
});

const route = useRoute();
const slug = route.params.slug as string;

// Fetch event data
const { data: eventData } = await useFetch<EventWithImagesResponse>(
  `/api/events/${slug}`
);

const event = computed(() => eventData.value);
const images = computed(() => event.value?.images || []);
const selectedImage = ref<(typeof images.value)[0] | null>(null);

useHead({
  title: event.value?.name || "Event",
});

useSeoMeta({
  ogImage: getOgImageUrl("events"),
  twitterImage: getTwitterImageUrl("events"),
  description: event.value?.description || undefined,
});
</script>

<template>
  <div class="md:mt-20">
    <div v-if="event" class="mx-auto max-w-6xl px-4 py-8">
      <!-- Event Header -->
      <div class="mb-8">
        <h1
          class="mb-2 font-ghost text-3xl text-black selection:bg-black selection:text-white md:text-4xl lg:text-5xl"
        >
          {{ event.name }}
        </h1>

        <div
          class="flex flex-col gap-2 font-ghost text-base text-neutral-600 md:text-lg"
        >
          <p>
            <span class="font-semibold">{{ event.start_date }}</span>
            <span v-if="event.end_date"> - {{ event.end_date }}</span>
          </p>
          <p>{{ event.location }}</p>
        </div>

        <p
          v-if="event.description"
          class="mt-4 font-ghost text-base text-neutral-700 md:text-lg"
        >
          {{ event.description }}
        </p>

        <a
          v-if="event.external_url"
          :href="event.external_url"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-4 inline-block font-ghost text-base text-blue-600 underline hover:text-blue-800 md:text-lg"
        >
          View Event Website →
        </a>
      </div>

      <!-- Event Images Grid -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ImageGridItem
          v-for="image in images"
          :key="image.id"
          :image="image"
          @click="selectedImage = image"
          class="cursor-pointer"
        />
      </div>

      <!-- No images message -->
      <div
        v-if="images.length === 0"
        class="py-12 text-center font-ghost text-neutral-500"
      >
        No images available for this event.
      </div>
    </div>

    <!-- Event not found -->
    <div v-else class="mx-auto max-w-6xl px-4 py-16 text-center">
      <h1 class="mb-4 font-ghost text-3xl text-black">Event Not Found</h1>
      <NuxtLink
        to="/events"
        class="font-ghost text-lg text-blue-600 underline hover:text-blue-800"
      >
        ← Back to Events
      </NuxtLink>
    </div>

    <!-- Lightbox -->
    <ImageLightbox
      :is-open="!!selectedImage"
      :image-path="selectedImage?.r2_path ?? ''"
      :alt="selectedImage?.alt ?? 'Event Image'"
      :description="selectedImage?.description ?? ''"
      @close="selectedImage = null"
    />
  </div>
</template>
