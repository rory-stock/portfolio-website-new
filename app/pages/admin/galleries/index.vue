<script setup lang="ts">
import BaseModal from "~/pages/admin/components/BaseModal.vue";
import GalleryCreateForm from "~/pages/admin/components/GalleryCreateForm.vue";
import { formatDateShort } from "~/utils/format";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

definePageMeta({
  middleware: "authenticated",
  layout: "admin",
});

useHead({ title: "Galleries Admin" });

interface GalleryListItem {
  id: number;
  name: string;
  slug: string;
  folder_id: number;
  client_name: string | null;
  shoot_date: string | null;
  cover_image: { url: string; alt: string } | null;
  image_count: number;
}

const loading = ref(true);
const error = ref<string | null>(null);
const galleries = ref<GalleryListItem[]>([]);
const showCreateModal = ref(false);

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = computed(() => breakpoints.isSmaller("md"));

async function fetchGalleries() {
  loading.value = true;
  error.value = null;

  try {
    const data = await $fetch<{ galleries: GalleryListItem[]; total: number }>(
      "/api/galleries"
    );
    galleries.value = data.galleries;
  } catch (err: any) {
    error.value = err.data?.message || "Failed to load galleries";
  } finally {
    loading.value = false;
  }
}

function onGalleryCreated() {
  showCreateModal.value = false;
  void fetchGalleries();
}

onMounted(fetchGalleries);
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6 p-6 md:mt-6">
    <!-- Header -->
    <div class="flex items-center gap-2 md:justify-between md:gap-0">
      <h1 class="text-2xl font-bold text-white md:text-3xl">Galleries</h1>
      <AppButton
        variant="primary"
        text-size="sm"
        @click="showCreateModal = true"
      >
        <span v-if="!isMobile">New gallery</span>
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
      Loading galleries...
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300"
    >
      {{ error }}
    </div>

    <!-- Empty state -->
    <div
      v-else-if="galleries.length === 0"
      class="flex flex-col items-center gap-1 py-16 text-center"
    >
      <p class="text-neutral-400">No galleries yet.</p>
      <AppButton
        variant="secondary"
        class="w-fit"
        @click="showCreateModal = true"
      >
        Create your first gallery
      </AppButton>
    </div>

    <!-- Gallery list -->
    <div
      v-else
      class="max-h-96 space-y-3 overflow-y-scroll rounded-lg border border-neutral-800 p-4"
    >
      <NuxtLink
        v-for="gallery in galleries"
        :key="gallery.id"
        :to="`/admin/galleries/${gallery.slug}`"
        class="group flex items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4 px-2 transition-colors hover:border-neutral-700 hover:bg-neutral-900/80"
      >
        <!-- Cover image -->
        <div class="h-16 w-24 shrink-0 overflow-hidden rounded bg-neutral-800">
          <ProgressiveImage
            v-if="gallery.cover_image"
            :src="gallery.cover_image.url"
            :alt="gallery.cover_image.alt"
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
              {{ gallery.name }}
            </h3>
            <div
              class="mt-0.5 flex flex-col text-xs text-neutral-500 md:flex-row md:items-center md:gap-3"
            >
              <span v-if="gallery.client_name">{{ gallery.client_name }}</span>
              <span
                v-if="gallery.client_name && gallery.shoot_date && !isMobile"
                >|</span
              >
              <span v-if="gallery.shoot_date">{{
                formatDateShort(gallery.shoot_date)
              }}</span>
            </div>
          </div>

          <!-- Stats -->
          <div class="flex shrink-0 items-center text-xs text-neutral-500">
            <span>
              {{ gallery.image_count }} image{{
                gallery.image_count !== 1 ? "s" : ""
              }}
            </span>
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

    <!-- Create gallery modal -->
    <BaseModal
      :open="showCreateModal"
      title="New Gallery"
      max-width="lg"
      @close="showCreateModal = false"
    >
      <div class="p-5">
        <GalleryCreateForm
          @created="onGalleryCreated"
          @cancel="showCreateModal = false"
        />
      </div>
    </BaseModal>
  </div>
</template>
