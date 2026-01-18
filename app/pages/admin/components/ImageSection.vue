<template>
  <div class="rounded border border-neutral-800 bg-neutral-900 p-6">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-xl font-bold text-neutral-100 md:text-2xl">
        {{ title }}
      </h2>
      <span
        v-if="!isLoading && !fetchError && organizedItems.length > 0"
        class="text-sm text-neutral-400 md:text-base"
      >
        {{ organizedItems.length }}
        {{ organizedItems.length === 1 ? "item" : "items" }}
      </span>
    </div>

    <!-- Upload Zone -->
    <UploadZone
      :context="context"
      @uploaded="handleUploadComplete"
      class="mb-6"
    />

    <div v-if="isLoading" class="text-neutral-400">Loading images...</div>
    <div v-else-if="fetchError" class="text-red-400">{{ fetchError }}</div>

    <div v-else>
      <!-- Gallery Grid - Simple Mode (no layouts) -->
      <VueDraggable
        v-if="!showLayoutWizard"
        v-model="organizedItems"
        :animation="150"
        ghost-class="opacity-50"
        drag-class="cursor-grabbing"
        class="mb-6 grid grid-cols-2 items-center gap-4 md:grid-cols-3 lg:grid-cols-4"
      >
        <div
          v-for="element in organizedItems"
          :key="(element as DisplayImage).id"
          class="h-fit w-fit"
        >
          <ImageAdminThumbnail
            :image="element as DisplayImage"
            :showPrimaryToggle="props.showPrimaryToggle"
            @click="openModal(element as DisplayImage)"
            @toggle-primary="handleTogglePrimary(element as DisplayImage)"
          />
        </div>
      </VueDraggable>

      <!-- Gallery Grid - With Layouts Mode -->
      <VueDraggable
        v-else
        v-model="organizedItems"
        :animation="150"
        ghost-class="opacity-50"
        drag-class="cursor-grabbing"
        class="mb-6 grid grid-cols-3 items-center gap-4"
      >
        <template v-for="element in organizedItems" :key="getItemKey(element)">
          <!-- Group Container - Isolated Component (spans full width) -->
          <ImageGroupContainer
            v-if="isGroup(element)"
            :group-images="element.images"
            :layout-type="element.layout_type"
            @update="(newOrder) => (element.images = newOrder)"
            @open-modal="openModal"
            @toggle-primary="handleTogglePrimary"
            class="col-span-3"
          />

          <!-- Hero Image (1 column) -->
          <div
            v-else-if="isHero(element)"
            class="relative h-fit w-fit rounded-lg border-2 border-neutral-100 p-2"
          >
            <div
              class="absolute -top-3 left-3 flex gap-1 bg-neutral-900 px-2 py-0.5 text-xs text-neutral-400"
            >
              <Icon name="dashboard" :size="15" />
              {{ heroLabel(element) }}
            </div>
            <ImageAdminThumbnail
              :image="element"
              :showPrimaryToggle="props.showPrimaryToggle"
              @click="openModal(element)"
              @toggle-primary="handleTogglePrimary(element)"
            />
          </div>

          <!-- Individual Image (1 column) -->
          <div v-else class="h-fit w-fit">
            <ImageAdminThumbnail
              :image="element"
              :showPrimaryToggle="props.showPrimaryToggle"
              @click="openModal(element)"
              @toggle-primary="handleTogglePrimary(element)"
            />
          </div>
        </template>
      </VueDraggable>

      <p
        v-if="organizedItems.length === 0"
        class="py-8 text-center text-neutral-400"
      >
        No images yet. Upload some to get started.
      </p>

      <!-- Save/Discard buttons for order -->
      <div
        v-if="organizedItems.length > 0"
        class="flex flex-col gap-2 border-t border-neutral-800 pt-4 md:flex-row md:gap-3"
      >
        <AppButton
          type="button"
          @click="onSaveOrder"
          :disabled="!orderChanged || saving"
          :loading="saving"
        >
          <template #loading>Saving Order...</template>
          Save Order
        </AppButton>
        <AppButton
          variant="secondary"
          type="button"
          @click="handleDiscardOrder"
          :disabled="!orderChanged || saving"
        >
          Discard Order Changes
        </AppButton>
      </div>
    </div>

    <!-- Image Detail Modal -->
    <ImageDetailModal
      :open="modalOpen"
      :image="selectedImage"
      :fields="fields"
      :all-images="images"
      :context="context"
      :show-layout-wizard="showLayoutWizard"
      @close="modalOpen = false"
      @updated="handleImageUpdated"
      @deleted="handleImageDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from "vue-draggable-plus";
import { onKeyStroke } from "@vueuse/core";
import { getHeroType, isImageGroup, isImageHero } from "~/utils/imageGroups";
import type { DisplayImage, ImageField } from "~~/types/imageTypes";
import { useImageData } from "~/composables/useImageData";

interface Props {
  context: string;
  title: string;
  fields: ImageField[];
  showLayoutWizard?: boolean;
  showPrimaryToggle?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showLayoutWizard: false,
  showPrimaryToggle: false,
});

const { success, error: showError } = useToast();

// Data fetching
const { images, isLoading, fetchError, fetchImages } = useImageData(
  props.context,
  props.showLayoutWizard
);

// Drag & drop ordering
const {
  organizedItems,
  orderChanged,
  saving,
  handleSaveOrder,
  handleDiscardOrder,
} = useImageOrdering(props.context, images, props.showLayoutWizard);

// Modal state
const modalOpen = ref(false);
const selectedImage = ref<DisplayImage | null>(null);

// Event handlers
const handleUploadComplete = () => {
  fetchImages();
};

const onSaveOrder = async () => {
  const success = await handleSaveOrder();
  if (success) {
    await fetchImages();
  }
};

const openModal = (image: DisplayImage) => {
  selectedImage.value = image;
  modalOpen.value = true;
};

const handleImageUpdated = async () => {
  await fetchImages();

  if (selectedImage.value) {
    const updated = images.value.find(
      (img) => img.instanceId === selectedImage.value!.instanceId
    );
    if (updated) {
      selectedImage.value = updated;
    }
  }
};

const handleImageDeleted = () => {
  fetchImages();
};

const handleTogglePrimary = async (image: DisplayImage) => {
  try {
    await $fetch(`/api/images/${image.instanceId}`, {
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

// Helper functions for template
const isGroup = isImageGroup;
const isHero = isImageHero;
const heroType = getHeroType;

const heroLabel = (item: DisplayImage) => {
  const type = heroType(item);
  if (type == "fullscreen-hero") {
    return "Fullscreen Hero";
  }
  return "Single Hero";
};

const getItemKey = (item: any) => {
  if (isGroup(item)) {
    return `group-${item.group_id}`;
  }
  return `image-${item.id}`;
};

// Keyboard shortcuts
onKeyStroke(
  "s",
  async (e) => {
    if ((e.ctrlKey || e.metaKey) && orderChanged.value && !saving.value) {
      e.preventDefault();
      const success = await handleSaveOrder();
      if (success) {
        await fetchImages();
      }
    }
  },
  { dedupe: true }
);

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

// Initial fetch
onMounted(() => {
  fetchImages();
});
</script>
