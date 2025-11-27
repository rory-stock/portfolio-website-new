<template>
  <div class="rounded border border-neutral-800 bg-neutral-900 p-6">
    <h2 class="mb-6 text-xl font-bold text-neutral-100 md:text-2xl">
      {{ title }}
    </h2>

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
      <draggable
        v-model="displayOrder"
        item-key="id"
        :animation="200"
        ghost-class="opacity-50"
        drag-class="cursor-grabbing"
        class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
      >
        <template #item="{ element }">
          <div class="sortable-item mt-auto mb-auto">
            <ImageThumbnail
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
          class="cursor-pointer rounded bg-neutral-100 px-2 py-2 text-[0.92rem] text-neutral-980 transition-all duration-200 hover:bg-neutral-300 disabled:opacity-50 md:px-4 md:text-base"
        >
          {{ saving ? "Saving Order..." : "Save Order" }}
        </button>
        <button
          type="button"
          @click="handleDiscardOrder"
          :disabled="!orderChanged || saving"
          class="cursor-pointer rounded border border-neutral-700 px-2 py-2 text-[0.92rem] text-neutral-200 transition-all duration-200 hover:bg-neutral-800 disabled:opacity-50 md:px-4 md:text-base"
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
import type { ImageBase, ImageField } from "~~/types/imageTypes";

interface Props {
  context: string;
  title: string;
  fields: ImageField[];
}

const props = defineProps<Props>();
const { success, error: showError } = useToast();

const loading = ref(true);
const error = ref("");
const saving = ref(false);

const images = ref<ImageBase[]>([]);
const originalOrder = ref<number[]>([]);
const displayOrder = ref<ImageBase[]>([]);

const modalOpen = ref(false);
const selectedImage = ref<ImageBase | null>(null);

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
    const response = await $fetch<{ images: ImageBase[]; total: number }>(
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

onMounted(() => {
  fetchImages();
});
</script>

<style scoped>
.sortable-item {
  cursor: move;
}

.sortable-item:active {
  cursor: grabbing;
}
</style>
