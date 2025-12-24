<template>
  <div class="rounded border border-neutral-800 bg-neutral-900 p-6">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-xl font-bold text-neutral-100 md:text-2xl">
        {{ title }} Images
      </h2>
      <span
        v-if="!isLoading && !fetchError"
        class="text-sm text-neutral-400 md:text-base"
      >
        {{ images.length }}
        {{ images.length === 1 ? "image" : "images" }}
      </span>
    </div>

    <!-- Upload Zone -->
    <UploadZone
      :context="context"
      @uploaded="handleUploadComplete"
      class="mb-6"
    />

    <div v-if="isLoading" class="text-neutral-400">Loading images...</div>
    <div v-else-if="fetchError" class="text-red-400">
      {{ fetchError }}
    </div>

    <div v-else>
      <!-- Gallery Grid (native drag-and-drop for outer, vuedraggable for groups) -->
      <div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <template
          v-for="item in organizedItems"
          :key="isGroup(item) ? `group-${item.group_id}` : item.id"
        >
          <!-- Group Wrapper -->
          <div
            v-if="isGroup(item)"
            class="relative col-span-full rounded-lg border-2 border-neutral-100 p-3"
            draggable="true"
            @dragstart="handleDragStart($event, item)"
            @dragover.prevent="handleDragOver($event)"
            @drop="handleDrop($event, item)"
            @dragend="handleDragEnd"
            :class="{ 'opacity-50': draggedItem === item }"
          >
            <!-- Group Badge -->
            <div
              class="absolute -top-3 left-3 bg-neutral-900 px-2 py-0.5 text-xs text-neutral-400"
            >
              {{ getLayoutLabel(item.layout_type) }}
            </div>

            <!-- Drag Handle for Group -->
            <div
              class="absolute -top-3 right-3 cursor-grab rounded bg-neutral-900 p-1 hover:bg-neutral-800"
            >
              <Icon name="dashboard" class="text-neutral-400" :size="16" />
            </div>

            <!-- Images within group (vuedraggable for internal reorder) -->
            <draggable
              v-model="item.images"
              item-key="id"
              :animation="200"
              ghost-class="opacity-50"
              :group="{
                name: `group-${item.group_id}`,
                pull: false,
                put: false,
              }"
              tag="div"
              class="grid gap-3"
              :class="getGroupGridClass(item.layout_type)"
            >
              <template #item="{ element: image }">
                <div class="cursor-move">
                  <ImageAdminThumbnail
                    :image="image"
                    @click="openModal(image)"
                    @toggle-primary="handleTogglePrimary(image)"
                  />
                </div>
              </template>
            </draggable>
          </div>

          <!-- Individual Image -->
          <div
            v-else
            draggable="true"
            @dragstart="handleDragStart($event, item)"
            @dragover.prevent="handleDragOver($event)"
            @drop="handleDrop($event, item)"
            @dragend="handleDragEnd"
            :class="{ 'opacity-50': draggedItem === item }"
            class="my-auto` h-fit w-fit cursor-move"
          >
            <ImageAdminThumbnail
              :image="item"
              @click="openModal(item)"
              @toggle-primary="handleTogglePrimary(item)"
            />
          </div>
        </template>
      </div>

      <p v-if="images.length === 0" class="py-8 text-center text-neutral-400">
        No images yet. Upload some to get started.
      </p>

      <!-- Save/Discard buttons for order -->
      <div
        v-if="images.length > 0"
        class="flex flex-col gap-2 border-t border-neutral-800 pt-4 md:flex-row md:gap-3"
      >
        <button
          type="button"
          @click="handleSaveOrder"
          :disabled="!orderChanged || saving"
          class="cursor-pointer rounded bg-neutral-100 px-2 py-2 text-[0.92rem] text-neutral-980 transition-all duration-200 hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-50 md:px-4 md:text-base"
        >
          {{ saving ? "Saving Order..." : "Save Order" }}
        </button>
        <button
          type="button"
          @click="handleDiscardOrder"
          :disabled="!orderChanged || saving"
          class="cursor-pointer rounded border border-neutral-700 px-2 py-2 text-[0.92rem] text-neutral-200 transition-all duration-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 md:px-4 md:text-base"
        >
          Discard Order Changes
        </button>
      </div>
    </div>

    <!-- Image Detail Modal -->
    <ImageDetailModal
      :open="modalOpen"
      :image="selectedImage"
      :all-images="images"
      :context="context"
      :fields="fields"
      :show-layout-wizard="props.showLayoutWizard"
      @close="modalOpen = false"
      @updated="handleImageUpdated"
      @deleted="handleImageDeleted"
      @refresh="fetchImages"
    />
  </div>
</template>

<script setup lang="ts">
import draggable from "vuedraggable";
import { onKeyStroke } from "@vueuse/core";
import type { ImageBase, ImageField, ImageGroup } from "~~/types/imageTypes";
import { LAYOUT_TYPES } from "~~/types/layoutTypes";
import {
  organizeImagesForAdmin,
  isImageGroup,
  flattenImagesForApi,
} from "~/utils/imageGroups";

interface Props {
  context: string;
  title: string;
  fields: ImageField[];
  showLayoutWizard?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showLayoutWizard: false,
});
const { success, error: showError } = useToast();

const saving = ref(false);

const modalOpen = ref(false);
const selectedImage = ref<ImageBase | null>(null);

const images = ref<ImageBase[]>([]);
const isLoading = ref(false);
const fetchError = ref<string | null>(null);

const fetchImages = async () => {
  isLoading.value = true;
  fetchError.value = null;

  try {
    const response = await $fetch<{ images: ImageBase[]; total: number }>(
      `/api/images?context=${props.context}`,
      {
        // Force fresh fetch, no cache
        headers: useRequestHeaders(["cookie"]),
      }
    );
    images.value = response.images;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load images";
    fetchError.value = message;
    showError(message);
  } finally {
    isLoading.value = false;
  }
};

// Initial fetch
onMounted(() => {
  fetchImages();
});

// Organize images into groups for display
const organizedItems = ref<(ImageBase | ImageGroup)[]>([]);
watch(
  () => images.value,
  (newImages) => {
    organizedItems.value = organizeImagesForAdmin(newImages);
  },
  { immediate: true }
);

// Track the original order for change detection
const originalOrder = computed(() =>
  flattenImagesForApi(organizeImagesForAdmin(images.value))
);

// Current order after dragging
const currentOrder = computed(() => flattenImagesForApi(organizedItems.value));

const orderChanged = computed(() => {
  if (currentOrder.value.length !== originalOrder.value.length) return true;
  return currentOrder.value.some(
    (id, index) => id !== originalOrder.value[index]
  );
});

// Native drag-and-drop state
const draggedItem = ref<ImageBase | ImageGroup | null>(null);

function handleDragStart(event: DragEvent, item: ImageBase | ImageGroup) {
  draggedItem.value = item;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
}

function handleDragOver(event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
}

function handleDrop(event: DragEvent, targetItem: ImageBase | ImageGroup) {
  event.preventDefault();

  if (!draggedItem.value || draggedItem.value === targetItem) {
    return;
  }

  const items = [...organizedItems.value];
  const dragged = draggedItem.value; // Store in const for type narrowing

  // Find indices
  const draggedIndex = items.findIndex((i) => {
    if (isGroup(i) && isGroup(dragged)) {
      return i.group_id === dragged.group_id;
    }
    if (!isGroup(i) && !isGroup(dragged)) {
      return i.id === dragged.id;
    }
    return false;
  });

  const targetIndex = items.findIndex((i) => {
    if (isGroup(i) && isGroup(targetItem)) {
      return i.group_id === targetItem.group_id;
    }
    if (!isGroup(i) && !isGroup(targetItem)) {
      return i.id === targetItem.id;
    }
    return false;
  });

  if (draggedIndex === -1 || targetIndex === -1) {
    return;
  }

  // Reorder
  const [removed] = items.splice(draggedIndex, 1);
  if (removed) {
    // Type guard
    items.splice(targetIndex, 0, removed);
    organizedItems.value = items;
  }
}

function handleDragEnd() {
  draggedItem.value = null;
}

const handleSaveOrder = async () => {
  saving.value = true;

  try {
    await $fetch("/api/images/reorder", {
      method: "POST",
      body: {
        context: props.context,
        order: currentOrder.value,
      },
    });

    // Refetch to get server's version of truth
    await fetchImages();

    success("Image order saved");
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save order";
    showError(message);
  } finally {
    saving.value = false;
  }
};

const handleDiscardOrder = async () => {
  await fetchImages();
  success("Order changes discarded");
};

const handleUploadComplete = () => {
  fetchImages();
};

const openModal = (image: ImageBase) => {
  selectedImage.value = image;
  modalOpen.value = true;
};

const handleImageUpdated = async () => {
  await fetchImages();

  if (selectedImage.value) {
    const updated = images.value.find(
      (img) => img.id === selectedImage.value!.id
    );
    if (updated) {
      selectedImage.value = updated;
    }
  }
};

const handleImageDeleted = () => {
  fetchImages();
};

const handleTogglePrimary = async (image: ImageBase) => {
  try {
    await $fetch(`/api/images/${image.id}`, {
      method: "PATCH",
      body: {
        is_primary: !image.is_primary,
      },
    });

    success("Primary status updated");
    await fetchImages();
  } catch (e: any) {
    showError(e.message || "Failed to update primary status");
  }
};

// Helper functions
function isGroup(item: ImageBase | ImageGroup): item is ImageGroup {
  return isImageGroup(item);
}

function getLayoutLabel(layoutType: string): string {
  return LAYOUT_TYPES[layoutType]?.label || layoutType;
}

function getGroupGridClass(layoutType: string): string {
  const count = LAYOUT_TYPES[layoutType]?.imageCount || 1;
  return (
    {
      2: "grid-cols-2",
      3: "grid-cols-3",
    }[count] || "grid-cols-1"
  );
}

// Keyboard shortcut: Ctrl/Cmd + S to save order
onKeyStroke(
  "s",
  (e) => {
    if ((e.ctrlKey || e.metaKey) && orderChanged.value && !saving.value) {
      e.preventDefault();
      handleSaveOrder();
    }
  },
  { dedupe: true }
);

// Keyboard shortcut: Ctrl/Cmd + Z to discard order
onKeyStroke(
  "z",
  (e) => {
    if ((e.ctrlKey || e.metaKey) && orderChanged.value && !saving.value) {
      e.preventDefault();
      handleDiscardOrder();
    }
  },
  { dedupe: true }
);
</script>
