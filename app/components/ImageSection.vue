<template>
  <div class="rounded border border-neutral-800 bg-neutral-900 p-6">
    <h2 class="mb-6 text-2xl font-bold text-neutral-100">{{ title }}</h2>

    <!-- Upload Zone -->
    <UploadZone
      :context="context"
      @uploaded="handleUploadComplete"
      class="mb-6"
    />

    <div v-if="loading" class="text-neutral-400">Loading images...</div>
    <div v-else-if="error" class="text-red-400">{{ error }}</div>

    <div v-else>
      <!-- Gallery Grid -->
      <div
        ref="sortableContainer"
        class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
      >
        <div
          v-for="image in displayOrder"
          :key="image.id"
          class="sortable-item cursor-move"
        >
          <ImageThumbnail
            :image="image"
            @click="openModal(image)"
            @toggle-primary="handleTogglePrimary(image)"
          />
        </div>
      </div>

      <p
        v-if="displayOrder.length === 0"
        class="py-8 text-center text-neutral-400"
      >
        No images yet. Upload some to get started.
      </p>

      <!-- Save/Discard buttons for order -->
      <div
        v-if="displayOrder.length > 0"
        class="flex gap-3 border-t border-neutral-800 pt-4"
      >
        <button
          type="button"
          @click="handleSaveOrder"
          :disabled="!orderChanged || saving"
          class="cursor-pointer rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {{ saving ? "Saving Order..." : "Save Order" }}
        </button>
        <button
          type="button"
          @click="handleDiscardOrder"
          :disabled="!orderChanged || saving"
          class="cursor-pointer rounded border border-neutral-700 px-4 py-2 text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
        >
          Discard Order Changes
        </button>
      </div>
    </div>

    <!-- Image Detail Modal -->
    <ImageDetailModal
      :open="modalOpen"
      :image="selectedImage"
      @close="modalOpen = false"
      @updated="handleImageUpdated"
      @deleted="handleImageDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { useSortable } from "@vueuse/integrations/useSortable";

interface Image {
  id: number;
  context: string;
  r2_path: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  file_size: number;
  original_filename: string;
  exif_data: string | null;
  is_primary: boolean;
  is_public: boolean;
  order: number | null;
  uploaded_at: string;
}

interface Props {
  context: string;
  title: string;
}

const props = defineProps<Props>();
const { success, error: showError } = useToast();

const loading = ref(true);
const error = ref("");
const saving = ref(false);

const images = ref<Image[]>([]);
const originalOrder = ref<number[]>([]);
const displayOrder = ref<Image[]>([]);

const sortableContainer = ref<HTMLElement | null>(null);
const modalOpen = ref(false);
const selectedImage = ref<Image | null>(null);

// Initialize useSortable
useSortable(sortableContainer, displayOrder, {
  animation: 150,
  ghostClass: "opacity-50",
  handle: ".sortable-item",
  forceFallback: true,
});

const currentOrder = computed(() => displayOrder.value.map((img) => img.id));

const orderChanged = computed(() => {
  if (currentOrder.value.length !== originalOrder.value.length) return true;
  return currentOrder.value.some(
    (id, index) => id !== originalOrder.value[index]
  );
});

const fetchImages = async () => {
  loading.value = true;
  error.value = "";

  try {
    const response = await $fetch<{ images: Image[]; total: number }>(
      `/api/images?context=${props.context}`
    );
    images.value = response.images;
    displayOrder.value = [...response.images];

    // Store original order
    originalOrder.value = response.images.map((img) => img.id);
  } catch (e: any) {
    error.value = e.message || "Failed to load images";
    showError(error.value);
  } finally {
    loading.value = false;
  }
};

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

    originalOrder.value = [...currentOrder.value];
    success("Image order saved");
  } catch (e: any) {
    showError(e.message || "Failed to save order");
  } finally {
    saving.value = false;
  }
};

const handleDiscardOrder = () => {
  // Reset to original order
  displayOrder.value = [...images.value].sort((a, b) => {
    const indexA = originalOrder.value.indexOf(a.id);
    const indexB = originalOrder.value.indexOf(b.id);
    return indexA - indexB;
  });
  success("Order changes discarded");
};

const handleUploadComplete = () => {
  fetchImages();
};

const openModal = (image: Image) => {
  selectedImage.value = image;
  modalOpen.value = true;
};

const handleImageUpdated = () => {
  fetchImages();
};

const handleImageDeleted = () => {
  fetchImages();
};

const handleTogglePrimary = async (image: Image) => {
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

onMounted(() => {
  fetchImages();
});
</script>

<style scoped>
.sortable-item {
  cursor: move;
}
</style>
