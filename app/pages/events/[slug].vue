<script setup lang="ts">
import { getOgImageUrl, getTwitterImageUrl } from "~/utils/meta";
import type { DisplayImage } from "~~/types/imageTypes";
import MasonryImageGrid from "~/components/MasonryImageGrid.vue";

definePageMeta({
  layout: "events",
});

const route = useRoute();
const slug = route.params.slug as string;

interface SubEvent {
  id: number;
  name: string;
  slug: string;
  start_date: string;
  location: string;
  images: DisplayImage[];
}

interface PublicEventData {
  id: number;
  name: string;
  slug: string;
  start_date: string;
  end_date: string | null;
  location: string;
  description: string | null;
  external_url: string | null;
  sub_events: SubEvent[];
  images: DisplayImage[];
}

// Fetch from public endpoint
const { data: eventData } = await useFetch<PublicEventData>(
  `/api/events/${slug}/public`
);

const event = computed(() => eventData.value);
const subEvents = computed(() => event.value?.sub_events ?? []);
const hasSubEvents = computed(() => subEvents.value.length > 0);

// Active sub-event tab (default to first)
const activeSubSlug = ref<string | null>(null);

watch(
  subEvents,
  (subs) => {
    if (subs.length > 0 && !activeSubSlug.value) {
      activeSubSlug.value = subs[0]!.slug;
    }
  },
  { immediate: true }
);

const activeSubEvent = computed(() => {
  if (!hasSubEvents.value) return null;
  return subEvents.value.find((s) => s.slug === activeSubSlug.value) ?? null;
});

// Images to display — either active sub-event images or root images
const displayImages = computed(() => {
  if (hasSubEvents.value && activeSubEvent.value) {
    return activeSubEvent.value.images;
  }
  return event.value?.images ?? [];
});

// Lightbox
const selectedImage = ref<DisplayImage | null>(null);

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
    <div v-if="event" class="mx-auto max-w-7xl px-4 py-8">
      <!-- Event header -->
      <div class="mb-6">
        <h1
          class="mb-1 font-ghost text-2xl text-black selection:bg-black selection:text-white md:text-3xl lg:text-4xl"
        >
          {{ event.name }}
        </h1>

        <div
          class="flex flex-col gap-1 font-ghost text-sm text-neutral-500 md:text-base"
        >
          <p>
            <span>{{ event.start_date }}</span>
            <span v-if="event.end_date"> — {{ event.end_date }}</span>
            <span v-if="event.location"> · {{ event.location }}</span>
          </p>
        </div>

        <p
          v-if="event.description"
          class="mt-3 font-ghost text-sm text-neutral-600 md:text-base"
        >
          {{ event.description }}
        </p>

        <a
          v-if="event.external_url"
          :href="event.external_url"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-3 inline-block font-ghost text-sm text-neutral-500 underline hover:text-neutral-800 md:text-base"
        >
          View Event Website →
        </a>
      </div>

      <!-- Sub-event tabs -->
      <div v-if="hasSubEvents" class="mb-6 border-b border-neutral-200">
        <div class="flex items-center gap-6 overflow-x-auto">
          <button
            v-for="sub in subEvents"
            :key="sub.id"
            type="button"
            class="shrink-0 cursor-pointer border-b-2 pb-2 font-ghost text-sm tracking-wide uppercase transition-colors md:text-base"
            :class="
              activeSubSlug === sub.slug
                ? 'border-black text-black'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            "
            @click="activeSubSlug = sub.slug"
          >
            {{ sub.name }}
          </button>
        </div>
      </div>

      <!-- Image grid -->
      <MasonryImageGrid
        v-if="displayImages.length > 0"
        :images="displayImages"
        :column-width="350"
        :gap="8"
        @image-click="selectedImage = $event"
      />

      <!-- No images -->
      <div
        v-else-if="!hasSubEvents || activeSubEvent"
        class="py-12 text-center font-ghost text-neutral-400"
      >
        No images available.
      </div>
    </div>

    <!-- Event not found -->
    <div v-else class="mx-auto max-w-6xl px-4 py-16 text-center">
      <h1 class="mb-4 font-ghost text-3xl text-black">Event Not Found</h1>
      <NuxtLink
        to="/events"
        class="font-ghost text-lg text-neutral-500 underline hover:text-black"
      >
        ← Back to Events
      </NuxtLink>
    </div>

    <!-- Lightbox -->
    <ImageLightbox
      :is-open="!!selectedImage"
      :image-path="selectedImage?.r2_path ?? selectedImage?.url ?? ''"
      :alt="selectedImage?.alt ?? 'Event Image'"
      :description="selectedImage?.description ?? ''"
      @close="selectedImage = null"
    />
  </div>
</template>
