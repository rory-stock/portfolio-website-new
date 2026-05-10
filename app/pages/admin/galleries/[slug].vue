<script setup lang="ts">
import { formatDateShort } from "~/utils/format";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import GalleryEditForm from "~/pages/admin/components/GalleryEditForm.vue";
import GallerySubfolderCreateForm from "../components/GallerySubfolderCreateForm.vue";

definePageMeta({
  middleware: "authenticated",
  layout: "admin",
});

const route = useRoute();
const slug = computed(() => route.params.slug as string);

interface GalleryDetail {
  id: number;
  name: string;
  slug: string;
  folder_id: number;
  client_name: string | null;
  shoot_date: string | null;
}

interface SubFolder {
  id: number;
  name: string;
  slug: string;
  parent_folder_id: number | null;
  image_count: number;
}

interface FolderData {
  id: number;
  image_count: number;
}

const loading = ref(true);
const error = ref<string | null>(null);
const galleryData = ref<GalleryDetail | null>(null);
const subFolders = ref<SubFolder[]>([]);
const rootFolderImageCount = ref(0);
const showEditModal = ref(false);
const showCreateFolderModal = ref(false);

const activeSubSlug = computed(() => (route.params.subSlug as string) || null);

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = computed(() => breakpoints.isSmaller("md"));

async function fetchGallery() {
  loading.value = true;
  error.value = null;

  try {
    const data = await $fetch<GalleryDetail>(`/api/galleries/${slug.value}`);
    galleryData.value = data;

    useHead({ title: `${data.name} — Galleries Admin` });

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

    // Fetch sub-folders
    await fetchSubFolders();
  } catch (err: any) {
    error.value = err.data?.message || "Failed to load gallery";
  } finally {
    loading.value = false;
  }
}

async function fetchSubFolders() {
  if (!galleryData.value?.folder_id) return;

  try {
    const data = await $fetch<{ folders: SubFolder[] }>("/api/folders", {
      query: { folder_type: "gallery" },
    });

    // Filter to only subfolders of this gallery's root folder
    subFolders.value = data.folders.filter(
      (f) => f.parent_folder_id === galleryData.value!.folder_id
    );
  } catch {
    subFolders.value = [];
  }
}

const totalImageCount = computed(() => {
  let total = rootFolderImageCount.value;
  for (const sub of subFolders.value) {
    total += sub.image_count;
  }
  return total;
});

async function onGalleryUpdated(newSlug: string) {
  showEditModal.value = false;

  if (newSlug !== slug.value) {
    await navigateTo(`/admin/galleries/${newSlug}`, { replace: true });
  } else {
    await fetchGallery();
  }
}

async function onFolderCreated() {
  showCreateFolderModal.value = false;
  await fetchSubFolders();
}

onMounted(fetchGallery);

// Provide data to child routes
provide("galleryData", galleryData);
provide("subFolders", subFolders);
provide("refreshGallery", fetchGallery);
</script>

<template>
  <div class="mx-auto max-w-6xl p-6 md:mt-6">
    <!-- Loading -->
    <div v-if="loading" class="py-12 text-center text-neutral-400">
      Loading gallery...
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300"
    >
      {{ error }}
      <NuxtLink to="/admin/galleries" class="ml-2 underline hover:text-red-200">
        Back to galleries
      </NuxtLink>
    </div>

    <!-- Gallery loaded -->
    <div v-else-if="galleryData">
      <!-- Back link -->
      <NuxtLink to="/admin/galleries" class="mb-4 inline-flex">
        <AppButton
          variant="secondary"
          text-size="sm"
          class="flex items-center gap-1"
        >
          <Icon name="back" :size="14" class="rotate-180" />Back to galleries
        </AppButton>
      </NuxtLink>

      <!-- Header -->
      <div class="mb-6 flex items-start justify-between md:gap-4">
        <div class="md:max-w-3/4">
          <h1 class="text-2xl font-bold text-white md:text-3xl">
            {{ galleryData.name }}
          </h1>
          <div class="mt-1 flex items-center gap-3 text-sm text-neutral-500">
            <div class="flex flex-col md:flex-row">
              <span v-if="galleryData.client_name">
                {{ galleryData.client_name }}
              </span>
              <span v-if="galleryData.client_name && galleryData.shoot_date">
                {{ isMobile ? "" : "&nbsp;&nbsp;|&nbsp;&nbsp;" }}
              </span>
              <span v-if="galleryData.shoot_date">
                {{ formatDateShort(galleryData.shoot_date) }}
              </span>
            </div>
          </div>
        </div>

        <AppButton
          variant="secondary"
          text-size="md"
          @click="showEditModal = true"
        >
          <span v-if="!isMobile">Edit gallery</span>
          <Icon v-else name="edit" :size="16" />
        </AppButton>
      </div>

      <div
        class="rounded border border-neutral-800 bg-neutral-900 px-4 pt-1 pb-6"
      >
        <!-- Sub-folder navigation tabs -->
        <div class="mb-6 border-b border-neutral-800">
          <div class="flex items-center gap-1 overflow-x-auto">
            <!-- "All images" tab (gallery root folder) -->
            <NuxtLink
              :to="`/admin/galleries/${slug}`"
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

            <!-- Sub-folder tabs -->
            <NuxtLink
              v-for="sub in subFolders"
              :key="sub.id"
              :to="`/admin/galleries/${slug}/${sub.slug}`"
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

            <!-- Add sub-folder button -->
            <AppButton
              variant="secondary-simple"
              text-size="sm"
              class="border-b-2 border-transparent"
              @click="showCreateFolderModal = true"
            >
              <span class="flex items-center gap-1">
                <Icon
                  name="cross"
                  :size="13"
                  stroke="white"
                  stroke-linejoin="miter"
                  stroke-width="0.2"
                  class="rotate-45"
                />
                Add
              </span>
            </AppButton>
          </div>
        </div>

        <!-- Child route content -->
        <NuxtPage />
      </div>
    </div>

    <!-- Edit gallery modal -->
    <BaseModal
      :open="showEditModal"
      title="Edit Gallery"
      max-width="lg"
      @close="showEditModal = false"
    >
      <div class="p-5">
        <GalleryEditForm
          v-if="galleryData"
          :gallery="galleryData"
          @updated="onGalleryUpdated"
          @deleted="navigateTo('/admin/galleries')"
          @cancel="showEditModal = false"
        />
      </div>
    </BaseModal>

    <!-- Create sub-folder modal -->
    <BaseModal
      :open="showCreateFolderModal"
      title="New Sub-folder"
      @close="showCreateFolderModal = false"
    >
      <div class="p-5">
        <GallerySubfolderCreateForm
          :parent-folder-id="galleryData!.folder_id"
          @created="onFolderCreated"
          @cancel="showCreateFolderModal = false"
        />
      </div>
    </BaseModal>

    <Toast />
  </div>
</template>
