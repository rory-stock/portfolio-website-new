<script setup lang="ts">
const route = useRoute();

// Injected from parent layout
const eventData = inject<Ref<any>>("eventData");
const subEvents = inject<Ref<any[]>>("subEvents");
const refreshEvent = inject<() => Promise<void>>("refreshEvent");

const activeSubSlug = computed(() => (route.params.subSlug as string) || null);

// Determine which folder to display
const activeFolderId = computed<number | null>(() => {
  if (!activeSubSlug.value) {
    // Root tab — show event's own folder
    return eventData?.value?.folder_id ?? null;
  }

  // Sub-event tab — find matching sub-event's folder
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

    // Sort by captured_at → created_at → filename
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

// Also refetch aggregated when subEvents change (new uploads in sub-folders)
watch(
  () => subEvents?.value,
  () => {
    if (isRootTab.value) {
      void fetchAggregatedImages();
    }
  },
  { deep: true }
);

// Selection state — use reactive Map for proper reactivity
const selectedIds = ref(new Set<number>());
const selectedImage = ref<any>(null);

// Sub-event edit/delete
const showEditSubEventModal = ref(false);
const deletingSubEvent = ref(false);

function toggleSelect(instanceId: number) {
  const newSet = new Set(selectedIds.value);
  if (newSet.has(instanceId)) {
    newSet.delete(instanceId);
  } else {
    newSet.add(instanceId);
  }
  selectedIds.value = newSet;
}

function clearSelection() {
  selectedIds.value = new Set();
}

// Image detail modal
function openImageDetail(image: any) {
  selectedImage.value = image;
}

function closeImageDetail() {
  selectedImage.value = null;
}

async function onImageRemoved(instanceId: number) {
  if (selectedIds.value.has(instanceId)) {
    const newSet = new Set(selectedIds.value);
    newSet.delete(instanceId);
    selectedIds.value = newSet;
  }

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

// Bulk remove
const bulkDeleting = ref(false);

async function bulkRemove() {
  if (selectedIds.value.size === 0) return;

  const confirmed = window.confirm(
    `Remove ${selectedIds.value.size} image${selectedIds.value.size > 1 ? "s" : ""} from this folder?`
  );
  if (!confirmed) return;

  bulkDeleting.value = true;

  const idsToRemove = [...selectedIds.value];
  for (const id of idsToRemove) {
    try {
      await removeImage(id);
    } catch (err) {
      console.error(`Failed to remove image ${id}:`, err);
    }
  }

  selectedIds.value = new Set();
  bulkDeleting.value = false;

  void fetchFolder();
  if (refreshEvent) void refreshEvent();
}

// Sub-event edit
async function onSubEventUpdated() {
  showEditSubEventModal.value = false;
  if (refreshEvent) void refreshEvent();
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

    // Navigate back to parent event root
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
      <!-- Sub-event actions (only shown when viewing a sub-event) -->
      <div v-if="activeSubEvent" class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-medium text-neutral-200">
          {{ activeSubEvent.name }}
        </h2>
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
            variant="danger"
            text-size="sm"
            class="py-1.5"
            :disabled="deletingSubEvent"
            @click="deleteSubEvent"
          >
            {{ deletingSubEvent ? "Deleting..." : "Delete" }}
          </AppButton>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="mb-4 flex items-center justify-between">
        <div class="text-sm text-neutral-400">
          <span v-if="total > 0"
            >{{ total }} image{{ total !== 1 ? "s" : "" }}</span
          >
          <span v-else>No images yet</span>
          <span
            v-if="isRootTab && subEvents && subEvents.length > 0"
            class="ml-1 text-neutral-600"
          >
            (across all folders)
          </span>
        </div>

        <!-- Bulk actions (only for single folder tabs) -->
        <div
          v-if="!isRootTab && selectedIds.size > 0"
          class="flex items-center gap-2"
        >
          <span class="text-xs text-neutral-500">
            {{ selectedIds.size }} selected
          </span>
          <button
            :disabled="bulkDeleting"
            class="rounded border border-red-800 px-2 py-1 text-xs text-red-400 hover:bg-red-950/50 disabled:opacity-50"
            @click="bulkRemove"
          >
            {{ bulkDeleting ? "Removing..." : "Remove" }}
          </button>
          <button
            class="rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-400 hover:border-neutral-500"
            @click="clearSelection"
          >
            Clear
          </button>
        </div>
      </div>

      <!-- Upload zone (only for single folder tabs, not aggregated view) -->
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
        :selected-ids="isRootTab ? undefined : selectedIds"
        :cover-image-instance-id="folder?.cover_image?.instanceId ?? null"
        @image-click="openImageDetail"
        @image-select="toggleSelect"
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
