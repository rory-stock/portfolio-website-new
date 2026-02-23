<script setup lang="ts">
import EventCreateForm from "~/pages/admin/components/EventCreateForm.vue";
import BaseModal from "~/pages/admin/components/BaseModal.vue";
import EventEditForm from "~/pages/admin/components/EventEditForm.vue";

definePageMeta({
  middleware: "authenticated",
  layout: "admin",
});

const route = useRoute();
const slug = computed(() => route.params.slug as string);

interface EventDetail {
  id: number;
  name: string;
  slug: string;
  start_date: string;
  end_date: string | null;
  location: string;
  description: string | null;
  external_url: string | null;
  cover_image: { url: string; alt: string } | null;
  image_count: number;
  folder_id: number | null;
  parent_event_id: number | null;
}

interface SubEvent {
  id: number;
  name: string;
  slug: string;
  start_date: string;
  location: string;
  image_count: number;
  folder_id: number | null;
  sub_event_count: number;
  cover_image: { url: string; alt: string } | null;
}

const loading = ref(true);
const error = ref<string | null>(null);
const eventData = ref<EventDetail | null>(null);
const subEvents = ref<SubEvent[]>([]);
const showEditModal = ref(false);
const showCreateSubEventModal = ref(false);

// The currently active sub-slug from the child route
const activeSubSlug = computed(() => (route.params.subSlug as string) || null);

async function fetchEvent() {
  loading.value = true;
  error.value = null;

  try {
    const data = await $fetch<EventDetail>(`/api/events/${slug.value}`);
    eventData.value = data;

    useHead({ title: `${data.name} — Events Admin` });

    // Fetch sub-events
    if (data.id) {
      const subData = await $fetch<{ events: SubEvent[] }>(
        `/api/events/${data.id}/sub-events`
      );
      subEvents.value = subData.events;
    }
  } catch (err: any) {
    error.value = err.data?.message || "Failed to load event";
  } finally {
    loading.value = false;
  }
}

async function onSubEventCreated() {
  showCreateSubEventModal.value = false;
  // Refresh sub-events list
  if (eventData.value) {
    const subData = await $fetch<{ events: SubEvent[] }>(
      `/api/events/${eventData.value.id}/sub-events`
    );
    subEvents.value = subData.events;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-NZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

void fetchEvent();

// Provide event data to child routes
provide("eventData", eventData);
provide("subEvents", subEvents);
provide("refreshEvent", fetchEvent);
</script>

<template>
  <div class="mx-auto max-w-6xl p-6 md:mt-6">
    <!-- Loading -->
    <div v-if="loading" class="py-12 text-center text-neutral-400">
      Loading event...
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300"
    >
      {{ error }}
      <NuxtLink to="/admin/events" class="ml-2 underline hover:text-red-200">
        Back to events
      </NuxtLink>
    </div>

    <!-- Event loaded -->
    <div v-else-if="eventData">
      <!-- Back link -->
      <NuxtLink
        to="/admin/events"
        class="mb-4 inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300"
      >
        ← Back to events
      </NuxtLink>

      <!-- Header -->
      <div class="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white md:text-3xl">
            {{ eventData.name }}
          </h1>
          <div class="mt-1 flex items-center gap-3 text-sm text-neutral-500">
            <span>{{ formatDate(eventData.start_date) }}</span>
            <span v-if="eventData.end_date">
              — {{ formatDate(eventData.end_date) }}
            </span>
            <span>{{ eventData.location }}</span>
          </div>
          <p v-if="eventData.description" class="mt-2 text-sm text-neutral-400">
            {{ eventData.description }}
          </p>
        </div>

        <button
          class="shrink-0 rounded border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200 hover:border-neutral-500 hover:text-white"
          @click="showEditModal = true"
        >
          Edit event
        </button>
      </div>

      <!-- Sub-event navigation tabs -->
      <div class="mb-6 border-b border-neutral-800">
        <div class="flex items-center gap-1 overflow-x-auto">
          <!-- "All images" tab (event root folder) -->
          <NuxtLink
            :to="`/admin/events/${slug}`"
            class="shrink-0 border-b-2 px-3 py-2 text-sm transition-colors"
            :class="
              !activeSubSlug
                ? 'border-neutral-100 text-neutral-100'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            "
          >
            All images
            <span class="ml-1 text-xs text-neutral-600">
              {{ eventData.image_count }}
            </span>
          </NuxtLink>

          <!-- Sub-event tabs -->
          <NuxtLink
            v-for="sub in subEvents"
            :key="sub.id"
            :to="`/admin/events/${slug}/${sub.slug}`"
            class="shrink-0 border-b-2 px-3 py-2 text-sm transition-colors"
            :class="
              activeSubSlug === sub.slug
                ? 'border-neutral-100 text-neutral-100'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            "
          >
            {{ sub.name }}
            <span class="ml-1 text-xs text-neutral-600">
              {{ sub.image_count }}
            </span>
          </NuxtLink>

          <!-- Add sub-event button -->
          <button
            class="shrink-0 border-b-2 border-transparent px-3 py-2 text-sm text-neutral-600 hover:text-neutral-400"
            @click="showCreateSubEventModal = true"
          >
            + Add
          </button>
        </div>
      </div>

      <!-- Child route content (swaps without re-rendering header) -->
      <NuxtPage />
    </div>

    <!-- Edit event modal -->
    <BaseModal
      :open="showEditModal"
      title="Edit Event"
      max-width="lg"
      @close="showEditModal = false"
    >
      <div class="p-5">
        <EventEditForm
          v-if="eventData"
          :event="eventData"
          @updated="
            showEditModal = false;
            fetchEvent();
          "
          @deleted="navigateTo('/admin/events')"
          @cancel="showEditModal = false"
        />
      </div>
    </BaseModal>

    <!-- Create sub-event modal -->
    <BaseModal
      :open="showCreateSubEventModal"
      title="New Sub-Event"
      max-width="lg"
      @close="showCreateSubEventModal = false"
    >
      <div class="p-5">
        <EventCreateForm
          v-if="eventData"
          :parent-event-id="eventData.id"
          @created="onSubEventCreated"
          @cancel="showCreateSubEventModal = false"
        />
      </div>
    </BaseModal>
  </div>
</template>
