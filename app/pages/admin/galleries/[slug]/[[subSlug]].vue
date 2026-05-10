<script setup lang="ts">
const route = useRoute();

// Injected from parent layout
const galleryData = inject<Ref>("galleryData");
const subFolders = inject<Ref<any[]>>("subFolders");
const refreshGallery = inject<() => Promise<void>>("refreshGallery");

const activeSubSlug = computed(() => (route.params.subSlug as string) || null);

// Determine which folder to display
const activeFolderId = computed<number | null>(() => {
  if (!activeSubSlug.value) {
    return galleryData?.value?.folder_id ?? null;
  }

  const sub = subFolders?.value?.find(
    (s: any) => s.slug === activeSubSlug.value
  );
  return sub?.id ?? null;
});

// Active subfolder (for edit/delete)
const activeSubFolder = computed(() => {
  if (!activeSubSlug.value) return null;
  return (
    subFolders?.value?.find((s: any) => s.slug === activeSubSlug.value) ?? null
  );
});

const isRootTab = computed(() => !activeSubSlug.value);

// All folder IDs to aggregate (root + subfolders) for "All images"
const allFolderIds = computed<number[]>(() => {
  const ids: number[] = [];
  const rootId = galleryData?.value?.folder_id;
  if (rootId) ids.push(rootId);

  if (subFolders?.value) {
    for (const sub of subFolders.value) {
      if (sub.id) ids.push(sub.id);
    }
  }
  return ids;
});

// Folder images composable (used for single subfolder tabs)
const folderIdRef = computed(() => activeFolderId.value);

const {
  images: singleFolderImages,
  total: singleFolderTotal,
  loading: singleFolderLoading,
  loadingMore,
  error: singleFolderError,
  hasMore,
  fetchImages,
  loadMore,
  removeImage,
} = useFolderImages(folderIdRef, { limit: 50 });

// Aggregated images for "All images" tab
const aggregatedImages = ref<any[]>([]);
const aggregatedLoading = ref(false);
const aggregatedError = ref<string | null>(null);

async function fetchAggregatedImages() {
  if (!isRootTab.value || allFolderIds.value.length === 0) return;

  aggregatedLoading.value = true;
  aggregatedError.value = null;

  try {
    const allImages: any[] = [];

    for (const folderId of allFolderIds.value) {
      const data = await $fetch<{ images: any[]; total: number }>(
        `/api/folders/${folderId}/images`,
        { query: { page: 1, limit: 200 } }
      );
      allImages.push(...data.images);
    }

    allImages.sort((a, b) => {
      const aCaptured = a.captured_at
        ? new Date(a.captured_at).getTime()
        : Infinity;
      const bCaptured = b.captured_at
        ? new Date(b.captured_at).getTime()
        : Infinity;
      if (aCaptured !== bCaptured) return aCaptured - bCaptured;

      const aCreated = new Date(a.created_at).getTime();
      const bCreated = new Date(b.created_at).getTime();
      if (aCreated !== bCreated) return aCreated - bCreated;

      return (a.original_filename || "").localeCompare(
        b.original_filename || ""
      );
    });

    aggregatedImages.value = allImages;
  } catch (err: any) {
    aggregatedError.value = err.data?.message || "Failed to load images";
  } finally {
    aggregatedLoading.value = false;
  }
}

// Computed display values
const images = computed(() =>
  isRootTab.value ? aggregatedImages.value : singleFolderImages.value
);
const total = computed(() =>
  isRootTab.value ? aggregatedImages.value.length : singleFolderTotal.value
);
const loading = computed(() =>
  isRootTab.value ? aggregatedLoading.value : singleFolderLoading.value
);
const error = computed(() =>
  isRootTab.value ? aggregatedError.value : singleFolderError.value
);

// Folder data for cover image (root folder only)
const { folder, fetchFolder, updateCover } = useFolder(
  computed(() => galleryData?.value?.folder_id ?? null)
);

// Watch for tab changes
watch(
  isRootTab,
  (root) => {
    if (root) {
      void fetchAggregatedImages();
    }
  },
  { immediate: true }
);

watch(
  () => subFolders?.value,
  () => {
    if (isRootTab.value) {
      void fetchAggregatedImages();
    }
  },
  { deep: true }
);

// Selection system (subfolder tabs only)
const {
  selectedImageIds,
  isSelectionMode,
  hasSelection,
  selectedCount,
  selectedImages,
  selectAll,
  clearSelection,
  isSelected,
  enterSelectionMode,
  exitSelectionMode,
  handleSelectionClick,
} = useImageAdminActions({
  context: "galleries",
  images: singleFolderImages,
  onActionComplete: async () => {
    await fetchImages(1);
    await fetchFolder();
    if (refreshGallery) await refreshGallery();
  },
});

const { scheduleOperation } = useDelayedOperation();
const { success, error: showError } = useToast();

function handleImageSelect(instanceId: number, event: MouseEvent) {
  handleSelectionClick(instanceId, event);
}

// Bulk remove
function handleBulkRemove() {
  if (selectedCount.value === 0) return;

  const count = selectedCount.value;
  const ids = [...selectedImages.value.map((img) => img.instanceId)];

  scheduleOperation(
    `Removing ${count} image${count > 1 ? "s" : ""}`,
    async () => {
      let removed = 0;
      for (const id of ids) {
        try {
          await removeImage(id);
          removed++;
        } catch (err) {
          console.error(`Failed to remove image ${id}:`, err);
        }
      }

      exitSelectionMode();
      await fetchFolder();
      if (refreshGallery) await refreshGallery();

      if (removed === count) {
        success(`Successfully removed ${count} image${count > 1 ? "s" : ""}`);
      } else {
        showError(
          `Removed ${removed} of ${count} images. ${count - removed} failed.`
        );
      }
    },
    8000
  );
}

// Image detail modal
const selectedImage = ref<any>(null);

function openImageDetail(image: any) {
  selectedImage.value = image;
}

function closeImageDetail() {
  selectedImage.value = null;
}

async function onImageRemoved(instanceId: number) {
  if (isRootTab.value) {
    aggregatedImages.value = aggregatedImages.value.filter(
      (img) => img.instanceId !== instanceId
    );
  }

  await fetchFolder();
  if (refreshGallery) await refreshGallery();
}

async function onSetCover(instanceId: number) {
  try {
    await updateCover(instanceId);
  } catch (err) {
    console.error("Failed to set cover:", err);
  }
}

async function onUploadComplete() {
  if (isRootTab.value) {
    await fetchAggregatedImages();
  } else {
    await fetchImages(1);
  }
  await fetchFolder();
  if (refreshGallery) await refreshGallery();
}

// Sub-folder edit/delete
const showEditFolderModal = ref(false);
const deletingSubFolder = ref(false);

async function onSubFolderSaved(newSlug: string) {
  showEditFolderModal.value = false;

  if (refreshGallery) await refreshGallery();

  if (newSlug !== activeSubSlug.value) {
    const parentSlug = route.params.slug as string;
    await navigateTo(`/admin/galleries/${parentSlug}/${newSlug}`, {
      replace: true,
    });
  }
}

async function onSubFolderDeleted() {
  showEditFolderModal.value = false;
  await deleteSubFolder();
}

async function deleteSubFolder() {
  if (!activeSubFolder.value) return;

  const confirmed = window.confirm(
    `Delete folder "${activeSubFolder.value.name}"? This will remove all image links.`
  );
  if (!confirmed) return;

  deletingSubFolder.value = true;

  try {
    await $fetch(`/api/folders/${activeSubFolder.value.id}`, {
      method: "DELETE",
    });

    if (refreshGallery) await refreshGallery();

    const parentSlug = route.params.slug as string;
    await navigateTo(`/admin/galleries/${parentSlug}`);
  } catch (err: any) {
    console.error("Failed to delete sub-folder:", err);
    alert(err.data?.message || "Failed to delete sub-folder");
  } finally {
    deletingSubFolder.value = false;
  }
}

// Not found state
const notFound = computed(() => {
  if (!activeSubSlug.value) return false;
  if (!subFolders?.value) return false;
  return !subFolders.value.find((s: any) => s.slug === activeSubSlug.value);
});
</script>

<template>
  <div>
    <!-- Not found -->
    <div v-if="notFound" class="py-12 text-center text-neutral-500">
      Folder "{{ activeSubSlug }}" not found.
    </div>

    <!-- No folder linked -->
    <div
      v-else-if="!isRootTab && !activeFolderId && !loading"
      class="py-12 text-center text-neutral-500"
    >
      No folder linked.
    </div>

    <!-- Folder content -->
    <div v-else>
      <!-- Sub-folder toolbar (only on sub-folder tabs) -->
      <div
        v-if="activeSubFolder"
        class="mb-4 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3"
      >
        <!-- Top row: name, count, edit, delete -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <h2 class="text-lg font-medium text-neutral-200">
              {{ activeSubFolder.name }}
            </h2>
            <span v-if="total > 0" class="text-sm text-neutral-500">
              {{ total }} image{{ total !== 1 ? "s" : "" }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <AppButton
              variant="secondary"
              text-size="sm"
              class="py-1.5"
              @click="showEditFolderModal = true"
            >
              Edit
            </AppButton>
            <AppButton
              variant="danger-simple"
              text-size="sm"
              class="py-1.5"
              :disabled="deletingSubFolder"
              @click="deleteSubFolder"
            >
              {{ deletingSubFolder ? "Deleting..." : "Delete" }}
            </AppButton>
          </div>
        </div>

        <!-- Divider -->
        <div class="my-2 border-t border-neutral-800" />

        <!-- Bottom row: selection controls -->
        <div
          class="flex flex-col items-center justify-between gap-4 md:flex-row"
        >
          <AdminSelectionToolbar
            :is-selection-mode="isSelectionMode"
            @enter-selection="enterSelectionMode"
            @exit-selection="exitSelectionMode"
            @select-all="selectAll"
            class="w-full md:w-auto"
          />

          <div
            v-if="hasSelection"
            class="w-full border-t border-neutral-800 md:hidden"
          />

          <!-- Right side: count + Remove + Clear -->
          <div
            v-if="hasSelection"
            class="flex w-full flex-col-reverse items-center gap-2 md:w-auto md:flex-row"
          >
            <span class="pt-1 text-xs text-neutral-500 md:pt-0">
              {{ selectedCount }} selected
            </span>
            <AppButton
              variant="danger-simple"
              text-size="sm"
              class="w-full py-1 md:w-auto"
              @click="handleBulkRemove"
            >
              Remove
            </AppButton>
            <AppButton
              variant="secondary"
              text-size="sm"
              class="w-full py-1 md:w-auto"
              @click="clearSelection"
            >
              Clear
            </AppButton>
          </div>
        </div>
      </div>

      <!-- Root tab: simple count -->
      <div v-if="isRootTab" class="mb-4">
        <div class="text-sm text-neutral-400">
          <span v-if="total > 0">
            {{ total }} image{{ total !== 1 ? "s" : "" }}
          </span>
          <span v-else>No images yet</span>
          <span
            v-if="subFolders && subFolders.length > 0"
            class="ml-1 text-neutral-600"
          >
            (across all folders)
          </span>
        </div>
      </div>

      <!-- Upload zone -->
      <div v-if="!isRootTab && activeFolderId" class="mb-6">
        <FolderUploadZone
          :folder-id="activeFolderId"
          folder-type="gallery"
          @uploaded="onUploadComplete"
        />
      </div>

      <!-- Image grid -->
      <FolderImageGrid
        :images="images"
        :loading="loading"
        :loading-more="isRootTab ? false : loadingMore"
        :has-more="isRootTab ? false : hasMore"
        :selected-ids="isRootTab ? undefined : selectedImageIds"
        :cover-image-instance-id="folder?.cover_image?.instanceId ?? null"
        :is-selection-mode="isRootTab ? false : isSelectionMode"
        @image-click="openImageDetail"
        @image-select="handleImageSelect"
        @load-more="loadMore"
        @set-cover="onSetCover"
      />

      <!-- Error -->
      <div
        v-if="error"
        class="mt-4 rounded border border-red-800 bg-red-950/50 px-3 py-2 text-xs text-red-300"
      >
        {{ error }}
      </div>
    </div>

    <!-- Image detail modal -->
    <FolderImageDetailModal
      v-if="activeFolderId"
      :image="selectedImage"
      :folder-id="activeFolderId"
      :is-cover="selectedImage?.instanceId === folder?.cover_image?.instanceId"
      @close="closeImageDetail"
      @removed="onImageRemoved"
      @set-cover="onSetCover"
      @updated="fetchImages(1)"
    />

    <!-- Edit sub-folder modal -->
    <BaseModal
      :open="showEditFolderModal"
      title="Edit Folder"
      max-width="md"
      @close="showEditFolderModal = false"
    >
      <div class="p-5">
        <GallerySubfolderEditForm
          v-if="activeSubFolder"
          :folder="activeSubFolder"
          @saved="onSubFolderSaved"
          @deleted="onSubFolderDeleted"
          @cancel="showEditFolderModal = false"
        />
      </div>
    </BaseModal>
  </div>
</template>
