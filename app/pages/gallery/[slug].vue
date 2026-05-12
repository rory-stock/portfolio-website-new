<script setup lang="ts">
import type { DisplayImage } from "~~/types/imageTypes";

definePageMeta({
  layout: "gallery",
});

const route = useRoute();
const slug = route.params.slug as string;

interface SubFolder {
  id: number;
  name: string;
  slug: string;
  images: DisplayImage[];
}

interface PublicGalleryData {
  requiresAccess?: boolean;
  folderName?: string;
  requiredGates?: string[];
  rootFolderId?: number;
  id: number;
  name: string;
  slug: string;
  client_name: string | null;
  shoot_date: string | null;
  sub_folders?: SubFolder[];
  images?: DisplayImage[];
}

const { data: galleryData, refresh } = await useFetch<PublicGalleryData>(
  `/api/galleries/${slug}/public`
);

const gallery = computed(() => galleryData.value);
const requiresAccess = computed(() => gallery.value?.requiresAccess === true);
const subFolders = computed(() => gallery.value?.sub_folders ?? []);
const hasSubFolders = computed(() => subFolders.value.length > 0);

const activeSubSlug = computed(() => (route.params.subSlug as string) || null);

// Redirect to first subfolder when at gallery root with subfolders
watch(
  activeSubSlug,
  (subSlug) => {
    if (
      !subSlug &&
      !requiresAccess.value &&
      hasSubFolders.value &&
      subFolders.value[0]
    ) {
      void navigateTo(`/gallery/${slug}/${subFolders.value[0].slug}`, {
        replace: true,
      });
    }
  },
  { immediate: true }
);

// Provide data to child route
provide("publicGalleryData", galleryData);
provide("publicSubFolders", subFolders);

async function onVerified() {
  await refresh();

  // Redirect to first subfolder if at root
  if (
    !activeSubSlug.value &&
    subFolders.value.length > 0 &&
    subFolders.value[0]
  ) {
    await navigateTo(`/gallery/${slug}/${subFolders.value[0].slug}`, {
      replace: true,
    });
  }
}

useHead({
  title: gallery.value?.name || "Gallery",
});
</script>

<template>
  <div class="md:mt-20">
    <!-- Access Gate -->
    <div
      v-if="requiresAccess && gallery"
      class="flex min-h-[60vh] items-center justify-center"
    >
      <AccessGate
        :folder-name="gallery.folderName || gallery.name"
        :required-gates="gallery.requiredGates || []"
        :folder-id="gallery.rootFolderId || 0"
        @verified="onVerified"
      />
    </div>

    <!-- Gallery Content -->
    <div v-else-if="gallery" class="px-4 py-4 md:py-4">
      <!-- Gallery header -->
      <div
        class="mb-6 flex max-w-fit flex-col gap-1 selection:bg-black selection:text-white"
      >
        <h1
          class="w-fit font-lausanne-500 text-2xl tracking-tight text-black uppercase md:text-3xl lg:text-2xl"
        >
          {{ gallery.name }}
        </h1>

        <p
          v-if="gallery.client_name || gallery.shoot_date"
          class="w-fit font-lausanne-400 text-sm text-neutral-600 md:text-base"
        >
          <span v-if="gallery.client_name">{{ gallery.client_name }}</span>
          <span v-if="gallery.client_name && gallery.shoot_date"> · </span>
          <span v-if="gallery.shoot_date">{{ gallery.shoot_date }}</span>
        </p>
      </div>

      <!-- Subfolder tabs -->
      <div v-if="hasSubFolders" class="mb-6 border-b border-neutral-200">
        <div class="flex items-center gap-6 overflow-x-auto">
          <NuxtLink
            v-for="sub in subFolders"
            :key="sub.id"
            :to="`/gallery/${slug}/${sub.slug}`"
            class="shrink-0 border-b-2 pb-2 font-lausanne-500 text-sm uppercase transition-colors select-none md:text-base"
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

    <!-- Gallery not found -->
    <div
      v-else
      class="mx-auto max-w-6xl px-4 py-16 text-center selection:bg-black selection:text-white"
    >
      <h1 class="mb-4 font-ghost text-3xl text-black">Gallery Not Found</h1>
      <NuxtLink
        to="/gallery"
        class="font-ghost text-lg text-neutral-500 underline hover:text-black"
      >
        ← Back
      </NuxtLink>
    </div>
  </div>
</template>
