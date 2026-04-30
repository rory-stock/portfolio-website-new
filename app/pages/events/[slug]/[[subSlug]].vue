<script setup lang="ts">
import type { DisplayImage } from "~~/types/imageTypes";

const route = useRoute();

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
  sub_events: SubEvent[];
  images: DisplayImage[];
}

const eventData = inject<Ref<PublicEventData | null>>("publicEventData");
const subEvents = inject<Ref<SubEvent[]>>("publicSubEvents");

const activeSubSlug = computed(() => (route.params.subSlug as string) || null);

const hasSubEvents = computed(() => (subEvents?.value?.length ?? 0) > 0);

// Find active sub-event
const activeSubEvent = computed(() => {
  if (!activeSubSlug.value || !subEvents?.value) return null;
  return subEvents.value.find((s) => s.slug === activeSubSlug.value) ?? null;
});

// Determine which images to display
const displayImages = computed(() => {
  // Sub-event tab active — show that sub-event's images
  if (activeSubEvent.value) {
    return activeSubEvent.value.images;
  }

  // No sub-slug and no sub-events — show root folder images
  if (!activeSubSlug.value && !hasSubEvents.value) {
    return eventData?.value?.images ?? [];
  }

  return [];
});

// State detection
const isNotFound = computed(
  () => activeSubSlug.value && !activeSubEvent.value && hasSubEvents.value
);

const isEmpty = computed(
  () => !isNotFound.value && displayImages.value.length === 0
);

// Lightbox
const selectedImage = ref<DisplayImage | null>(null);
</script>

<template>
  <div>
    <!-- Sub-event not found -->
    <div
      v-if="isNotFound"
      class="py-16 text-center selection:bg-black selection:text-white"
    >
      <p class="font-ghost text-2xl text-black">
        This part of the event couldn't be found.
      </p>
      <NuxtLink
        :to="`/events/${route.params.slug}`"
        class="mt-3 inline-block font-ghost text-xl text-neutral-500 underline hover:text-black"
      >
        ← Back to event
      </NuxtLink>
    </div>

    <!-- No images -->
    <div v-else-if="isEmpty" class="py-16 text-center">
      <p
        class="font-ghost text-2xl text-black selection:bg-black selection:text-white"
      >
        No photos from this event yet — check back soon!
      </p>
    </div>

    <!-- Image grid -->
    <template v-else>
      <MasonryImageGrid
        :images="displayImages"
        :max-columns="3"
        :gap="8"
        @image-click="selectedImage = $event"
      />

      <!-- Lightbox -->
      <ImageLightbox
        :is-open="!!selectedImage"
        :image-path="selectedImage?.r2_path ?? selectedImage?.url ?? ''"
        :alt="selectedImage?.alt ?? 'Event Image'"
        :description="selectedImage?.description ?? ''"
        @close="selectedImage = null"
      />
    </template>
  </div>
</template>
