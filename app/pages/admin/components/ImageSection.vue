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
        class="mb-4 flex items-center gap-3"
      >
        <!-- Selection Mode Controls -->
        <template v-if="!isSelectionMode">
          <AppButton
            variant="secondary"
            @click="enterSelectionMode"
            class="text-sm"
          >
            Select
          </AppButton>
        </template>
        <template v-else>
          <AppButton variant="secondary" @click="selectAll" class="text-sm">
            Select All
          </AppButton>
          <MultiFilterDropdown @select="handleFilterSelect" />
          <AppButton
            variant="secondary"
            @click="exitSelectionMode"
            class="text-sm"
          >
            Exit Selection
          </AppButton>
        </template>
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
          <!-- Group Container - Isolated Component (spans full width) -->
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
              :isSelectionMode="isSelectionMode"
              :isSelected="isSelected(element.instanceId)"
              @click="handleImageClick($event, element)"
              @toggle-primary="handleTogglePrimary(element)"
            />
          </div>

          <!-- Individual Image (1 column) -->
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
      :open="showConfirmModal"
      :action="pendingAction!"
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
import type { MultiAction } from "~~/types/multiActions";

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

// Multi-select composables
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
  selectByFilter,
} = useMultiSelect({ images: imagesRef });

const { actions, getAllWarnings } = useMultiActions(props.context);

const { scheduleOperation, cancelPending } = useDelayedOperation();

// Multi-select state
const showConfirmModal = ref(false);
const pendingAction = ref<MultiAction | null>(null);
const pendingWarnings = ref<string[]>([]);
const isExecuting = ref(false);

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

// Computed confirmation content
const confirmationContent = computed(() => {
  if (!pendingAction.value) {
    return {
      title: "",
      message: "",
      confirmLabel: "Confirm",
    };
  }

  if (pendingAction.value.getConfirmation) {
    return pendingAction.value.getConfirmation(selectedImages.value);
  }

  // Default confirmation
  return {
    title: pendingAction.value.label,
    message: `Are you sure you want to ${pendingAction.value.label.toLowerCase()} ${selectedCount.value} image${selectedCount.value > 1 ? "s" : ""}?`,
    confirmLabel: pendingAction.value.label,
  };
});

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
    // Open modal
    openModal(image);
  } else {
    // Handle selection
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

const handleActionClick = (action: MultiAction) => {
  if (action.needsConfirmation) {
    // Get warnings
    const warnings = getAllWarnings(action, selectedImages.value);

    // Set pending state
    pendingAction.value = action;
    pendingWarnings.value = warnings;
    showConfirmModal.value = true;
  } else {
    // Execute directly with delay
    executeAction(action);
  }
};

const handleConfirmAction = () => {
  if (!pendingAction.value) return;

  // Close modal
  showConfirmModal.value = false;

  // Execute the action
  executeAction(pendingAction.value);

  // Clear pending
  pendingAction.value = null;
  pendingWarnings.value = [];
};

const handleCancelConfirmation = () => {
  showConfirmModal.value = false;
  pendingAction.value = null;
  pendingWarnings.value = [];
};

const executeAction = async (action: MultiAction) => {
  const count = selectedCount.value;
  const label = `${action.label} ${count} image${count > 1 ? "s" : ""}`;

  const proceed = scheduleOperation(
    label,
    async () => {
      isExecuting.value = true;
      try {
        await action.execute(selectedImages.value, props.context);
        await fetchImages();
        exitSelectionMode();
        success(
          `Successfully ${action.label.toLowerCase()} ${count} image${count > 1 ? "s" : ""}`
        );
      } catch (error: any) {
        showError(
          error.message || `Failed to ${action.label.toLowerCase()} images`
        );
      } finally {
        isExecuting.value = false;
      }
    },
    action.delay
  );

  if (!proceed) {
    // User cancelled due to an existing operation
    return;
  }
};

const handleFilterSelect = (filterIds: string[]) => {
  selectByFilter(filterIds);
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
