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
      <!-- Header Controls -->
      <div
        v-if="organizedItems.length > 0"
        class="mb-4 flex w-full flex-col gap-3 md:flex-row md:items-center"
      >
        <AdminSelectionToolbar
          :is-selection-mode="isSelectionMode"
          :show-filter="true"
          @enter-selection="enterSelectionMode"
          @exit-selection="exitSelectionMode"
          @select-all="selectAll"
          @filter-select="handleFilterSelect"
        />
      </div>

      <!-- Gallery Grid - Simple Mode (no layouts) -->
      <VueDraggable
        v-if="!showLayoutWizard"
        v-model="organizedItems"
        :disabled="isSelectionMode"
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
            :isSelectionMode="isSelectionMode"
            :isSelected="isSelected((element as DisplayImage).instanceId)"
            @click="handleImageClick($event, element as DisplayImage)"
            @toggle-primary="handleTogglePrimary(element as DisplayImage)"
          />
        </div>
      </VueDraggable>

      <!-- Gallery Grid - With Layouts Mode -->
      <VueDraggable
        v-else
        v-model="organizedItems"
        :disabled="isSelectionMode"
        :animation="150"
        ghost-class="opacity-50"
        drag-class="cursor-grabbing"
        class="mb-6 grid grid-cols-3 items-center gap-4"
      >
        <template v-for="element in organizedItems" :key="getItemKey(element)">
          <!-- Group Container -->
          <ImageGroupContainer
            v-if="isGroup(element)"
            :group-images="element.images"
            :layout-type="element.layout_type"
            :isSelectionMode="isSelectionMode"
            :isSelected="isSelected"
            @update="(newOrder) => (element.images = newOrder)"
            @open-modal="(image) => openModal(image)"
            @image-click="handleImageClick"
            @toggle-primary="handleTogglePrimary"
            :class="element.images.length > 1 ? 'col-span-3' : ''"
          />

          <!-- Hero Image -->
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
              :isSelectionMode="isSelectionMode"
              :isSelected="isSelected(element.instanceId)"
              @click="handleImageClick($event, element)"
              @toggle-primary="handleTogglePrimary(element)"
            />
          </div>

          <!-- Individual Image -->
          <div v-else class="h-fit w-fit">
            <ImageAdminThumbnail
              :image="element"
              :showPrimaryToggle="props.showPrimaryToggle"
              :isSelectionMode="isSelectionMode"
              :isSelected="isSelected(element.instanceId)"
              @click="handleImageClick($event, element)"
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
        v-if="organizedItems.length > 0 && !isSelectionMode"
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

    <MultiActionBar
      v-if="hasSelection"
      :selectedCount="selectedCount"
      :selectedImages="selectedImages"
      :actions="actions"
      @action="handleActionClick"
      @clearSelection="clearSelection"
    />

    <ImageDetailModal
      :open="modalOpen"
      :image="selectedImage"
      :fields="fields"
      :all-images="imagesRef"
      :context="context"
      :show-layout-wizard="showLayoutWizard"
      @close="modalOpen = false"
      @updated="handleImageUpdated"
      @deleted="handleImageDeleted"
      @refresh="handleRefresh"
    />

    <MultiOperationConfirm
      v-if="pendingAction"
      :open="showConfirmModal"
      :action="pendingAction"
      :selectedImages="selectedImages"
      :warnings="pendingWarnings"
      :confirmation="confirmationContent"
      :isExecuting="isExecuting"
      @confirm="handleConfirmAction"
      @cancel="handleCancelConfirmation"
    />
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from "vue-draggable-plus";
import { onKeyStroke } from "@vueuse/core";
import { getHeroType, isImageGroup, isImageHero } from "~/utils/imageGroups";
import type { DisplayImage, ImageField } from "~~/types/imageTypes";
import { useImageData } from "~/composables/useImageData";
import AdminSelectionToolbar from "~/pages/admin/components/AdminSelectionToolbar.vue";
import { useImageAdminActions } from "~/composables/useImageAdminActions";

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
const {
  images: imagesRef,
  isLoading,
  fetchError,
  fetchImages,
} = useImageData(props.context, props.showLayoutWizard);

// Multi-select and actions via composable
const {
  selectedImageIds,
  isSelectionMode,
  hasSelection,
  selectedCount,
  selectedImages,
  toggleSelection,
  selectAll,
  clearSelection,
  isSelected,
  enterSelectionMode,
  exitSelectionMode,
  selectRange,
  actions,
  showConfirmModal,
  pendingAction,
  pendingWarnings,
  isExecuting,
  confirmationContent,
  handleActionClick,
  handleConfirmAction,
  handleCancelConfirmation,
  handleFilterSelect,
} = useImageAdminActions({
  context: props.context,
  images: imagesRef,
  onActionComplete: async () => {
    await fetchImages();
  },
});

// Drag & drop ordering
const {
  organizedItems,
  orderChanged,
  saving,
  handleSaveOrder,
  handleDiscardOrder,
} = useImageOrdering(props.context, imagesRef, props.showLayoutWizard);

// Modal state
const modalOpen = ref(false);
const selectedImage = ref<DisplayImage | null>(null);

// Event handlers
const handleUploadComplete = () => {
  fetchImages();
};

const onSaveOrder = async () => {
  const result = await handleSaveOrder();
  if (result) {
    await fetchImages();
  }
};

const handleImageClick = (event: MouseEvent, image: DisplayImage) => {
  if (!isSelectionMode.value) {
    openModal(image);
  } else {
    if (event.shiftKey) {
      selectRange(image.instanceId);
    } else {
      toggleSelection(image.instanceId);
    }
  }
};

const openModal = (image: DisplayImage) => {
  selectedImage.value = image;
  modalOpen.value = true;
};

const handleImageUpdated = async () => {
  await fetchImages();

  if (selectedImage.value) {
    const updated = imagesRef.value.find(
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

const handleRefresh = async () => {
  await fetchImages();
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
      const result = await handleSaveOrder();
      if (result) {
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
