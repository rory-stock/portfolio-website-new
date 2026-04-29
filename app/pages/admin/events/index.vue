<script setup lang="ts">
import BaseModal from "~/pages/admin/components/BaseModal.vue";
import EventCreateForm from "~/pages/admin/components/EventCreateForm.vue";
import { formatDateShort } from "~/utils/format";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

definePageMeta({
  middleware: "authenticated",
  layout: "admin",
});

useHead({ title: "Events Admin" });

interface EventListItem {
  id: number;
  name: string;
  slug: string;
  start_date: string;
  end_date: string | null;
  location: string;
  description: string | null;
  cover_image: { url: string; alt: string } | null;
  image_count: number;
  sub_event_count: number;
  folder_id: number | null;
}

const loading = ref(true);
const error = ref<string | null>(null);
const events = ref<EventListItem[]>([]);
const showCreateModal = ref(false);

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = computed(() => breakpoints.isSmaller("md"));

async function fetchEvents() {
  loading.value = true;
  error.value = null;

  try {
    const data = await $fetch<{ events: EventListItem[]; total: number }>(
      "/api/events"
    );
    events.value = data.events;
  } catch (err: any) {
    error.value = err.data?.message || "Failed to load events";
  } finally {
    loading.value = false;
  }
}

function onEventCreated() {
  showCreateModal.value = false;
  void fetchEvents();
}

void fetchEvents();
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6 p-6 md:mt-6">
    <!-- Header -->
    <div class="flex items-center gap-2 md:justify-between md:gap-0">
      <h1 class="text-2xl font-bold text-white md:text-3xl">Events</h1>
      <AppButton
        variant="primary"
        text-size="sm"
        @click="showCreateModal = true"
      >
        <span v-if="!isMobile">New event</span>
        <Icon
          v-else
          name="cross"
          :size="16"
          stroke="black"
          stroke-width="0.5"
          class="rotate-45"
        />
      </AppButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-12 text-center text-neutral-400">
      Loading events...
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300"
    >
      {{ error }}
    </div>

    <!-- Empty state -->
    <div v-else-if="events.length === 0" class="py-16 text-center">
      <p class="text-neutral-400">No events yet.</p>
      <button
        class="mt-3 rounded border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:border-neutral-500"
        @click="showCreateModal = true"
      >
        Create your first event
      </button>
    </div>

    <!-- Events list -->
    <div v-else class="space-y-3">
      <NuxtLink
        v-for="evt in events"
        :key="evt.id"
        :to="`/admin/events/${evt.slug}`"
        class="group flex items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4 px-2 transition-colors hover:border-neutral-700 hover:bg-neutral-900/80"
      >
        <!-- Cover image -->
        <div class="h-16 w-24 shrink-0 overflow-hidden rounded bg-neutral-800">
          <ProgressiveImage
            v-if="evt.cover_image"
            :src="evt.cover_image.url"
            :alt="evt.cover_image.alt"
            class="h-full w-full object-cover"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-xs text-neutral-600"
          >
            No image
          </div>
        </div>

        <div
          :class="
            isMobile
              ? 'flex flex-col'
              : 'flex w-full items-center justify-between'
          "
        >
          <!-- Info -->
          <div class="min-w-0 flex-1">
            <h3
              class="truncate text-base font-medium text-neutral-100 group-hover:text-white"
            >
              {{ evt.name }}
            </h3>
            <div
              class="mt-0.5 flex flex-col text-xs text-neutral-500 md:flex-row md:items-center md:gap-3"
            >
              <span>{{ formatDateShort(evt.start_date) }}</span>
              <span v-if="!isMobile">|</span>
              <span>{{ evt.location }}</span>
            </div>
          </div>

          <!-- Stats -->
          <div class="flex shrink-0 items-center text-xs text-neutral-500">
            <div>
              <span v-if="evt.sub_event_count > 0">
                {{ evt.sub_event_count }} sub-event{{
                  evt.sub_event_count > 1 ? "s" : ""
                }}
              </span>
              <span v-if="evt.sub_event_count" class="px-2"
                >|</span
              >
              <span>
                {{ evt.image_count }} image{{
                  evt.image_count !== 1 ? "s" : ""
                }}
              </span>
            </div>
            <Icon
              v-if="!isMobile"
              name="back"
              :size="19"
              class="ml-2 text-neutral-700 group-hover:text-neutral-500"
            />
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Create event modal -->
    <BaseModal
      :open="showCreateModal"
      title="New Event"
      max-width="lg"
      @close="showCreateModal = false"
    >
      <div class="p-5">
        <EventCreateForm
          @created="onEventCreated"
          @cancel="showCreateModal = false"
        />
      </div>
    </BaseModal>
  </div>
</template>
