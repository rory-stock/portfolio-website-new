<script setup lang="ts">
import FolderImageDetailModal from "~/pages/admin/components/FolderImageDetailModal.vue";
import FolderImageGrid from "~/pages/admin/components/FolderImageGrid.vue";
import FolderUploadZone from "~/pages/admin/components/FolderUploadZone.vue";
import { useFolderImages } from "~/composables/useFolderImages";
import { useFolder } from "~/composables/useFolder";

const route = useRoute();

// Injected from the parent layout ([slug]/index.vue)
const eventData = inject<Ref>("eventData");
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

const activeEventName = computed(() => {
  if (!activeSubSlug.value) {
    return eventData?.value?.name ?? "Event";
  }
  const sub = subEvents?.value?.find(
    (s: any) => s.slug === activeSubSlug.value
  );
  return sub?.name ?? activeSubSlug.value;
});

// Folder images composable
const folderIdRef = computed(() => activeFolderId.value);

const {
  images,
  total,
  loading,
  loadingMore,
  error,
  hasMore,
  fetchImages,
  loadMore,
  removeImage,
} = useFolderImages(folderIdRef, { limit: 50 });

// Folder data for cover image
const { folder, fetchFolder, updateCover } = useFolder(folderIdRef);

// Selection state
const selectedIds = ref<Set<number>>(new Set());
const selectedImage = ref<any>(null);

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
  // Remove from local selection if selected
  if (selectedIds.value.has(instanceId)) {
    const newSet = new Set(selectedIds.value);
    newSet.delete(instanceId);
    selectedIds.value = newSet;
  }

  // Refresh folder data (image count, cover)
  void fetchFolder();

  // Refresh parent event data
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
  // Refresh images and folder data
  await fetchImages(1);
  void fetchFolder();

  // Refresh parent event data (image counts)
  if (refreshEvent) void refreshEvent();
}

// Bulk delete
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
      v-else-if="!activeFolderId && !loading"
      class="py-12 text-center text-neutral-500"
    >
      No folder linked to this event.
    </div>

    <!-- Folder content -->
    <div v-else>
      <!-- Toolbar -->
      <div class="mb-4 flex items-center justify-between">
        <div class="text-sm text-neutral-400">
          <span v-if="total > 0"
            >{{ total }} image{{ total !== 1 ? "s" : "" }}</span
          >
          <span v-else>No images yet</span>
        </div>

        <!-- Bulk actions (visible when images selected) -->
        <div v-if="selectedIds.size > 0" class="flex items-center gap-2">
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

      <!-- Upload zone -->
      <div class="mb-6">
        <FolderUploadZone
          v-if="activeFolderId"
          :folder-id="activeFolderId"
          folder-type="event"
          @uploaded="onUploadComplete"
        />
      </div>

      <!-- Image grid -->
      <FolderImageGrid
        :images="images"
        :loading="loading"
        :loading-more="loadingMore"
        :has-more="hasMore"
        :selected-ids="selectedIds"
        :cover-image-id="folder?.cover_image?.id ?? null"
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
      :is-cover="selectedImage?.instance_id === folder?.cover_image?.id"
      @close="closeImageDetail"
      @removed="onImageRemoved"
      @set-cover="onSetCover"
      @updated="fetchImages(1)"
    />
  </div>
</template>
