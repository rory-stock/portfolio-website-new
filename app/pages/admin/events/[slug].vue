<script setup lang="ts">
import { formatDateShort } from "~/utils/format";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

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

interface FolderData {
  id: number;
  image_count: number;
}

const loading = ref(true);
const error = ref<string | null>(null);
const eventData = ref<EventDetail | null>(null);
const subEvents = ref<SubEvent[]>([]);
const rootFolderImageCount = ref(0);
const subEventFolderCounts = ref<Record<number, number>>({});
const showEditModal = ref(false);
const showCreateSubEventModal = ref(false);

const activeSubSlug = computed(() => (route.params.subSlug as string) || null);

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = computed(() => breakpoints.isSmaller("md"));

async function fetchEvent() {
  loading.value = true;
  error.value = null;

  try {
    const data = await $fetch<EventDetail>(`/api/events/${slug.value}`);
    eventData.value = data;

    useHead({ title: `${data.name} — Events Admin` });

    // Fetch root folder image count
    if (data.folder_id) {
      try {
        const folderData = await $fetch<{ folder: FolderData }>(
          `/api/folders/${data.folder_id}`
        );
        rootFolderImageCount.value = folderData.folder.image_count;
      } catch {
        rootFolderImageCount.value = 0;
      }
    }

    // Fetch sub-events
    if (data.id) {
      const subData = await $fetch<{ events: SubEvent[] }>(
        `/api/events/${data.id}/sub-events`
      );
      subEvents.value = subData.events;

      // Fetch folder counts for each sub-event
      const counts: Record<number, number> = {};
      for (const sub of subData.events) {
        if (sub.folder_id) {
          try {
            const folderData = await $fetch<{ folder: FolderData }>(
              `/api/folders/${sub.folder_id}`
            );
            counts[sub.id] = folderData.folder.image_count;
          } catch {
            counts[sub.id] = 0;
          }
        }
      }
      subEventFolderCounts.value = counts;
    }
  } catch (err: any) {
    error.value = err.data?.message || "Failed to load event";
  } finally {
    loading.value = false;
  }
}

function getSubEventImageCount(sub: SubEvent): number {
  return subEventFolderCounts.value[sub.id] ?? 0;
}

const totalImageCount = computed(() => {
  let total = rootFolderImageCount.value;
  for (const count of Object.values(subEventFolderCounts.value)) {
    total += count;
  }
  return total;
});

async function onSubEventCreated() {
  showCreateSubEventModal.value = false;
  await fetchEvent();
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
        <AppButton
          variant="secondary"
          text-size="sm"
          class="flex items-center gap-1"
          ><Icon name="back" :size="14" class="rotate-180" />Back to
          events</AppButton
        >
      </NuxtLink>

      <!-- Header -->
      <div class="mb-6 flex items-start justify-between md:gap-4">
        <div>
          <h1 class="text-2xl font-bold text-white md:text-3xl">
            {{ eventData.name }}
          </h1>
          <div class="mt-1 flex items-center gap-3 text-sm text-neutral-500">
            <div class="flex flex-col md:flex-row">
              <div>
                <span>{{ formatDateShort(eventData.start_date) }}</span>
                <span v-if="eventData.end_date"
                  >&nbsp;—&nbsp;{{ formatDateShort(eventData.end_date) }}</span
                >
              </div>
              <span>
                {{ isMobile ? "" : "&nbsp;&nbsp;|&nbsp;&nbsp;"
                }}{{ eventData.location }}
              </span>
            </div>
          </div>
          <p v-if="eventData.description" class="mt-2 text-sm text-neutral-400">
            {{ eventData.description }}
          </p>
        </div>

        <AppButton
          variant="secondary"
          text-size="md"
          @click="showEditModal = true"
        >
          <span v-if="!isMobile">Edit event</span>
          <Icon v-else name="edit" :size="16" />
        </AppButton>
      </div>

      <div
        class="rounded border border-neutral-800 bg-neutral-900 px-4 pt-1 pb-6"
      >
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
                {{ totalImageCount }}
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
                {{ getSubEventImageCount(sub) }}
              </span>
            </NuxtLink>

            <!-- Add sub-event button -->
            <AppButton
              variant="secondary-simple"
              text-size="sm"
              class="border-b-2 border-transparent"
              @click="showCreateSubEventModal = true"
            >
              <span class="flex items-center gap-1"
                ><Icon
                  name="cross"
                  :size="13"
                  stroke="white"
                  stroke-linejoin="miter"
                  stroke-width="0.2"
                  class="rotate-45"
                />
                Add</span
              >
            </AppButton>
          </div>
        </div>

        <!-- Child route content -->
        <NuxtPage />
      </div>
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
