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
        {{ displayOrder.length }}
        {{ displayOrder.length === 1 ? "image" : "images" }}
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
      <!-- Gallery Grid -->
      <draggable
        v-model="displayOrder"
        item-key="id"
        :animation="200"
        ghost-class="opacity-50"
        drag-class="cursor-grabbing"
        class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
      >
        <template #item="{ element }">
          <div>
            <ImageAdminThumbnail
              :image="element"
              @click="openModal(element)"
              @toggle-primary="handleTogglePrimary(element)"
            />
          </div>
        </template>
      </draggable>

      <p
        v-if="displayOrder.length === 0"
        class="py-8 text-center text-neutral-400"
      >
        No images yet. Upload some to get started.
      </p>

      <!-- Save/Discard buttons for order -->
      <div
        v-if="displayOrder.length > 0"
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
      :fields="fields"
      @close="modalOpen = false"
      @updated="handleImageUpdated"
      @deleted="handleImageDeleted"
      @refresh="fetchImages"
    />
  </div>
</template>

<script setup lang="ts">
import draggable from "vuedraggable";
import { useAsyncState, useCloned, onKeyStroke } from "@vueuse/core";
import type { ImageBase, ImageField } from "~~/types/imageTypes";

interface Props {
  context: string;
  title: string;
  fields: ImageField[];
}

const props = defineProps<Props>();
const { success, error: showError } = useToast();

const saving = ref(false);

const modalOpen = ref(false);
const selectedImage = ref<ImageBase | null>(null);

const {
  state: images,
  isLoading,
  error: fetchError,
  execute: fetchImages,
} = useAsyncState(
  async () => {
    const response = await $fetch<{ images: ImageBase[]; total: number }>(
      `/api/images?context=${props.context}`
    );
    return response.images;
  },
  [] as ImageBase[],
  {
    immediate: true,
    onError: (e) => {
      const message = e instanceof Error ? e.message : "Failed to load images";
      showError(message);
    },
  }
);

const { cloned: displayOrder, sync: syncOrder } = useCloned(images);

const originalOrder = computed(() => images.value.map((img) => img.id));
const currentOrder = computed(() => displayOrder.value.map((img) => img.id));

const orderChanged = computed(() => {
  if (currentOrder.value.length !== originalOrder.value.length) return true;
  return currentOrder.value.some(
    (id, index) => id !== originalOrder.value[index]
  );
});

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
    syncOrder();

    success("Image order saved");
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save order";
    showError(message);
  } finally {
    saving.value = false;
  }
};

const handleDiscardOrder = () => {
  syncOrder(); // Reset to original
  success("Order changes discarded");
};

const handleUploadComplete = () => {
  fetchImages();
};

const openModal = (image: ImageBase) => {
  selectedImage.value = image;
  modalOpen.value = true;
};

const handleImageUpdated = () => {
  fetchImages();
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
</script>
