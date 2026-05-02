<script setup lang="ts">
import { getOgImageUrl, getTwitterImageUrl } from "~/utils/meta";
import type { DisplayImage } from "~~/types/imageTypes";

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

const { data: eventData } = await useFetch<PublicEventData>(
  `/api/events/${slug}/public`
);

const event = computed(() => eventData.value);
const subEvents = computed(() => event.value?.sub_events ?? []);
const hasSubEvents = computed(() => subEvents.value.length > 0);

const activeSubSlug = computed(() => (route.params.subSlug as string) || null);

// Redirect to first sub-event when at event root with sub-events
watch(
  activeSubSlug,
  (subSlug) => {
    if (!subSlug && hasSubEvents.value && subEvents.value[0]) {
      void navigateTo(`/events/${slug}/${subEvents.value[0].slug}`, {
        replace: true,
      });
    }
  },
  { immediate: true }
);

// Provide data to child route
provide("publicEventData", eventData);
provide("publicSubEvents", subEvents);

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
    <div v-if="event" class="px-4 py-4 md:py-6">
      <!-- Event header -->
      <div
        class="mb-6 max-w-min min-w-fit selection:bg-black selection:text-white"
      >
        <h1 class="mb-1 font-ghost text-2xl text-black md:text-3xl lg:text-4xl">
          {{ event.name }}
        </h1>

        <p class="font-ghost text-sm text-neutral-500 md:text-base">
          <span>{{ event.start_date }}</span>
          <span v-if="event.end_date"> — {{ event.end_date }}</span>
          <span v-if="event.location"> · {{ event.location }}</span>
        </p>

        <p
          v-if="event.description"
          class="mt-2 font-ghost text-sm text-neutral-600 md:text-base"
        >
          {{ event.description }}
        </p>

        <NuxtLink
          v-if="event.external_url"
          :href="event.external_url"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-2 inline-block font-ghost text-sm text-neutral-500 underline hover:text-neutral-800 md:text-base"
        >
          Event Backup Link →
        </NuxtLink>
      </div>

      <!-- Sub-event tabs -->
      <div v-if="hasSubEvents" class="mb-6 border-b border-neutral-200">
        <div class="flex items-center gap-6 overflow-x-auto">
          <NuxtLink
            v-for="sub in subEvents"
            :key="sub.id"
            :to="`/events/${slug}/${sub.slug}`"
            class="shrink-0 border-b-2 pb-2 font-ghost text-sm tracking-wide uppercase transition-colors select-none md:text-base"
            :class="
              activeSubSlug === sub.slug
                ? 'border-black text-black'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            "
          >
            {{ sub.name }}
          </NuxtLink>
        </div>
      </div>

      <!-- Child route content -->
      <NuxtPage />
    </div>

    <!-- Event not found -->
    <div
      v-else
      class="mx-auto max-w-6xl px-4 py-16 text-center selection:bg-black selection:text-white"
    >
      <h1 class="mb-4 font-ghost text-3xl text-black">Event Not Found</h1>
      <NuxtLink
        to="/events"
        class="font-ghost text-lg text-neutral-500 underline hover:text-black"
      >
        ← Back to Events
      </NuxtLink>
    </div>
  </div>
</template>
