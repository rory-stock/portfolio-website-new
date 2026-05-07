<script setup lang="ts">
const route = useRoute();

// Injected from parent layout
const eventData = inject<Ref>("eventData");
const subEvents = inject<Ref<any[]>>("subEvents");
const refreshEvent = inject<() => Promise<void>>("refreshEvent");

const activeSubSlug = computed(() => (route.params.subSlug as string) || null);

// Determine which folder to display
const activeFolderId = computed<number | null>(() => {
  if (!activeSubSlug.value) {
    return eventData?.value?.folder_id ?? null;
  }

  const sub = subEvents?.value?.find(
    (s: any) => s.slug === activeSubSlug.value
  );
  return sub?.folder_id ?? null;
});

// Active sub-event (for edit/delete)
const activeSubEvent = computed(() => {
  if (!activeSubSlug.value) return null;
  return (
    subEvents?.value?.find((s: any) => s.slug === activeSubSlug.value) ?? null
  );
});

// Whether we're on the root "All images" tab
const isRootTab = computed(() => !activeSubSlug.value);

// All folder IDs to aggregate (root + sub-event folders) for "All images"
const allFolderIds = computed<number[]>(() => {
  const ids: number[] = [];
  const rootId = eventData?.value?.folder_id;
  if (rootId) ids.push(rootId);

  if (subEvents?.value) {
    for (const sub of subEvents.value) {
      if (sub.folder_id) ids.push(sub.folder_id);
    }
  }
  return ids;
});

// Folder images composable (used for single sub-event tabs)
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

// Computed display values that switch between aggregated and single folder
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
  computed(() => eventData?.value?.folder_id ?? null)
);

// Watch for tab changes to fetch appropriate data
watch(
  isRootTab,
  (root) => {
    if (root) {
      void fetchAggregatedImages();
    }
  },
  { immediate: true }
);

// Also refetch aggregated when subEvents change
watch(
  () => subEvents?.value,
  () => {
    if (isRootTab.value) {
      void fetchAggregatedImages();
    }
  },
  { deep: true }
);

// Selection system via composable (sub-event tabs only)
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
  context: "events",
  images: singleFolderImages,
  onActionComplete: async () => {
    await fetchImages(1);
    void fetchFolder();
    if (refreshEvent) void refreshEvent();
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
      void fetchFolder();
      if (refreshEvent) void refreshEvent();

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

  void fetchFolder();
  if (refreshEvent) void refreshEvent();
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
  void fetchFolder();
  if (refreshEvent) void refreshEvent();
}

// Sub-event edit/delete
const showEditSubEventModal = ref(false);
const deletingSubEvent = ref(false);

async function onSubEventUpdated(newSlug: string) {
  showEditSubEventModal.value = false;

  if (refreshEvent) await refreshEvent();

  if (newSlug !== activeSubSlug.value) {
    const parentSlug = route.params.slug as string;
    await navigateTo(`/admin/events/${parentSlug}/${newSlug}`, {
      replace: true,
    });
  }
}

async function deleteSubEvent() {
  if (!activeSubEvent.value) return;

  const confirmed = window.confirm(
    `Delete sub-event "${activeSubEvent.value.name}"? This will also delete its folder and image links.`
  );
  if (!confirmed) return;

  deletingSubEvent.value = true;

  try {
    await $fetch(`/api/events/${activeSubEvent.value.id}`, {
      method: "DELETE",
    });

    if (refreshEvent) await refreshEvent();

    const parentSlug = route.params.slug as string;
    await navigateTo(`/admin/events/${parentSlug}`);
  } catch (err: any) {
    console.error("Failed to delete sub-event:", err);
    alert(err.data?.message || "Failed to delete sub-event");
  } finally {
    deletingSubEvent.value = false;
  }
}

// Not found state
const notFound = computed(() => {
  if (!activeSubSlug.value) return false;
  if (!subEvents?.value) return false;
  return !subEvents.value.find((s: any) => s.slug === activeSubSlug.value);
});
</script>

<template>
  <div>
    <!-- Not found -->
    <div v-if="notFound" class="py-12 text-center text-neutral-500">
      Sub-event "{{ activeSubSlug }}" not found.
    </div>

    <!-- No folder linked -->
    <div
      v-else-if="!isRootTab && !activeFolderId && !loading"
      class="py-12 text-center text-neutral-500"
    >
      No folder linked to this event.
    </div>

    <!-- Folder content -->
    <div v-else>
      <!-- Sub-event toolbar (only on sub-event tabs) -->
      <div
        v-if="activeSubEvent"
        class="mb-4 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3"
      >
        <!-- Top row: name, count, edit, delete -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <h2 class="text-lg font-medium text-neutral-200">
              {{ activeSubEvent.name }}
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
              @click="showEditSubEventModal = true"
            >
              Edit
            </AppButton>
            <AppButton
              variant="danger-simple"
              text-size="sm"
              class="py-1.5"
              :disabled="deletingSubEvent"
              @click="deleteSubEvent"
            >
              {{ deletingSubEvent ? "Deleting..." : "Delete" }}
            </AppButton>
          </div>
        </div>

        <!-- Divider -->
        <div class="my-2 border-t border-neutral-800" />

        <!-- Bottom row: selection controls -->
        <div class="flex items-center justify-between">
          <AdminSelectionToolbar
            :is-selection-mode="isSelectionMode"
            @enter-selection="enterSelectionMode"
            @exit-selection="exitSelectionMode"
            @select-all="selectAll"
          />

          <!-- Right side: count + Remove + Clear -->
          <div v-if="hasSelection" class="flex items-center gap-2">
            <span class="text-xs text-neutral-500">
              {{ selectedCount }} selected
            </span>
            <AppButton
              variant="danger-simple"
              text-size="sm"
              class="py-1"
              @click="handleBulkRemove"
            >
              Remove
            </AppButton>
            <AppButton
              variant="secondary"
              text-size="sm"
              class="py-1"
              @click="clearSelection"
            >
              Clear
            </AppButton>
          </div>
        </div>
      </div>

      <!-- Root tab: simple count text -->
      <div v-if="isRootTab" class="mb-4">
        <div class="text-sm text-neutral-400">
          <span v-if="total > 0">
            {{ total }} image{{ total !== 1 ? "s" : "" }}
          </span>
          <span v-else>No images yet</span>
          <span
            v-if="subEvents && subEvents.length > 0"
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
          folder-type="event"
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

    <!-- Edit sub-event modal -->
    <BaseModal
      :open="showEditSubEventModal"
      title="Edit Sub-Event"
      max-width="lg"
      @close="showEditSubEventModal = false"
    >
      <div class="p-5">
        <EventEditForm
          v-if="activeSubEvent"
          :event="activeSubEvent"
          @updated="onSubEventUpdated"
          @deleted="deleteSubEvent"
          @cancel="showEditSubEventModal = false"
        />
      </div>
    </BaseModal>
  </div>
</template>
