<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open && image"
        class="bg-opacity-75 fixed inset-0 z-50 flex items-center justify-center bg-neutral-980"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        @click.self="handleClose"
      >
        <div
          ref="modalRef"
          class="m-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between border-b border-neutral-800 p-6"
          >
            <h3 id="modal-title" class="text-xl font-bold text-neutral-100">
              Image Details
            </h3>
            <button
              @click="handleClose"
              class="cursor-pointer text-2xl text-neutral-400 transition-colors duration-200 hover:text-neutral-200 focus:outline-0"
              aria-label="Close modal"
            >
              <Icon name="cross" width="20" height="20" />
            </button>
          </div>

          <!-- Content -->
          <div class="space-y-3 p-6">
            <!-- Image preview -->
            <div class="flex justify-center">
              <NuxtPicture
                :src="image.r2_path"
                :alt="image.alt"
                format="webp"
                class="max-h-1/12 object-contain transition-all duration-300"
                :class="{ 'blur-sm': !imageLoaded }"
                @load="imageLoaded = true"
              />
            </div>

            <!-- Metadata -->
            <div
              class="mb-4 flex flex-col gap-2 text-sm md:mb-6 md:grid md:grid-cols-2 md:gap-4"
            >
              <div>
                <span class="text-neutral-400">Filename:</span>
                <span class="ml-2 text-neutral-100">{{
                  image.original_filename
                }}</span>
              </div>
              <div>
                <span class="text-neutral-400">Dimensions:</span>
                <span class="ml-2 text-neutral-100">{{
                  formatDimensions(image.width, image.height)
                }}</span>
              </div>
              <div>
                <span class="text-neutral-400">File Size:</span>
                <span class="ml-2 text-neutral-100">{{
                  formatFileSize(image.file_size)
                }}</span>
              </div>
              <div>
                <span class="text-neutral-400">Uploaded:</span>
                <span class="ml-2 text-neutral-100">{{
                  formatDate(image.created_at)
                }}</span>
              </div>
            </div>

            <!-- Editable fields -->
            <form
              @submit.prevent="handleSave"
              class="no-scrollbar space-y-4 overflow-y-auto px-1"
            >
              <ImageMetadataForm :fields="fields" v-model="formData" />
              <ImageContextSelector
                v-model:is-public="formData.is_public"
                v-model:selected-contexts="allImageContexts"
                :available-contexts="availableContexts"
                :is-loading="isLoadingContexts"
              />

              <!-- Layout Configuration -->
              <LayoutWizard
                v-if="props.image && props.showLayoutWizard"
                :current-image="props.image"
                :all-images="props.allImages"
                :context="props.context"
                @layout-assigned="handleLayoutAssigned"
                @layout-removed="handleLayoutRemoved"
              />

              <ImageActions
                :has-changes="hasChanges"
                :saving="saving"
                :deleting="deleting"
                @discard="handleDiscard"
                @delete="handleDelete"
              />
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { DisplayImage, ImageField } from "~~/types/imageTypes";
import { onKeyStroke } from "@vueuse/core";
import { formatFileSize, formatDate, formatDimensions } from "~/utils/format";

interface Props {
  open: boolean;
  image: DisplayImage | null;
  fields: ImageField[];
  allImages: DisplayImage[];
  context: string;
  showLayoutWizard?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showLayoutWizard: false,
});
const emit = defineEmits<{
  close: [];
  updated: [];
  deleted: [];
  refresh: [];
}>();

const { success, error: showError } = useToast();

const modalRef = ref<HTMLElement>();

const modalState = useModalState();
if (modalState) {
  watch(
    () => props.open,
    (value) => {
      modalState.isDetailModalOpen.value = value;
    }
  );
}

const saving = ref(false);
const deleting = ref(false);

const imageLoaded = ref(false);

const originalData = ref<Record<string, any>>({
  is_public: false,
});

const formData = ref<Record<string, any>>({
  is_public: false,
});

const allImageContexts = ref<string[]>(
  props.image ? [props.image.context] : []
);
const originalContexts = ref<string[]>(
  props.image ? [props.image.context] : []
);
const availableContexts = ref<string[]>([]);
const isLoadingContexts = ref(true);

// Close modal on Escape key
onKeyStroke("Escape", (e) => {
  if (props.open) {
    e.preventDefault();
    handleClose();
  }
});

// Save on Ctrl/Cmd + S
onKeyStroke(
  "s",
  (e) => {
    if (
      props.open &&
      (e.ctrlKey || e.metaKey) &&
      hasChanges.value &&
      !saving.value
    ) {
      e.preventDefault();
      handleSave();
    }
  },
  { dedupe: true }
);

// Revert changes on Ctrl/Cmd + Z
onKeyStroke("z", (e) => {
  if (
    props.open &&
    (e.ctrlKey || e.metaKey) &&
    hasChanges.value &&
    !saving.value
  ) {
    e.preventDefault();
    handleDiscard();
  }
});

const loadContextData = async () => {
  if (!props.image) return;

  const r2_path = props.image.r2_path;

  try {
    const [contextsRes, imagesRes] = await Promise.all([
      $fetch<{ contexts: string[] }>("/api/admin/context"),
      $fetch<{ images: Array<{ context: string }> }>(
        `/api/images?r2_path=${r2_path}`
      ),
    ]);

    availableContexts.value = contextsRes.contexts;
    allImageContexts.value = imagesRes.images.map((img: any) => img.context);
    originalContexts.value = [...allImageContexts.value];
  } finally {
    isLoadingContexts.value = false;
  }
};

const hasChanges = computed(() => {
  // Check field-based changes
  const fieldChanged = props.fields.some(
    (field) => formData.value[field.key] !== originalData.value[field.key]
  );

  // Check is_public change
  const publicChanged =
    formData.value.is_public !== originalData.value.is_public;

  const contextsChanged =
    JSON.stringify([...allImageContexts.value].sort()) !==
    JSON.stringify([...originalContexts.value].sort());

  return fieldChanged || publicChanged || contextsChanged;
});

watch(
  () => props.image,
  (newImage) => {
    if (newImage) {
      isLoadingContexts.value = true;

      // Initialize with field values
      const data: Record<string, any> = {
        is_public: newImage.is_public,
      };

      for (const field of props.fields) {
        data[field.key] = (newImage as any)[field.key] || "";
      }

      originalData.value = { ...data };
      formData.value = { ...data };

      loadContextData();
    }
  },
  { immediate: true }
);

const handleClose = () => {
  if (hasChanges.value) {
    if (confirm("You have unsaved changes. Are you sure you want to close?")) {
      emit("close");
    }
  } else {
    emit("close");
  }
};

const handleSave = async () => {
  if (!props.image) return;

  saving.value = true;

  try {
    // Build update body with all fields
    const body: Record<string, any> = {
      is_public: formData.value.is_public,
    };

    for (const field of props.fields) {
      body[field.key] = formData.value[field.key];
    }

    // Add context changes
    const currentSet = new Set(allImageContexts.value);
    const originalSet = new Set(originalContexts.value);

    const toAdd = [...currentSet].filter((c) => !originalSet.has(c));
    const toRemove = [...originalSet].filter((c) => !currentSet.has(c));

    if (toAdd.length > 0) body.add_contexts = toAdd;
    if (toRemove.length > 0) body.remove_contexts = toRemove;

    const removedCurrentContext = toRemove.includes(props.image.context);

    await $fetch(`/api/images/${props.image.instanceId}`, {
      method: "PATCH",
      body,
    });

    originalData.value = { ...formData.value };
    originalContexts.value = [...allImageContexts.value];
    success("Image updated successfully");
    if (removedCurrentContext) {
      emit("close");
      emit("refresh");
    } else {
      emit("updated");
    }
  } catch (e: any) {
    showError(e.message || "Failed to update image");
    allImageContexts.value = [...originalContexts.value];
  } finally {
    saving.value = false;
  }
};

const handleDiscard = () => {
  formData.value = { ...originalData.value };
  allImageContexts.value = [...originalContexts.value];
  success("Changes discarded");
};

const handleDelete = async () => {
  if (!props.image) return;

  if (
    !confirm(
      "Are you sure you want to delete this image? This action cannot be undone."
    )
  ) {
    return;
  }

  deleting.value = true;

  try {
    await $fetch(`/api/images/${props.image.instanceId}`, {
      method: "DELETE",
    });

    success("Image deleted successfully");
    emit("deleted");
    emit("close");
  } catch (e: any) {
    showError(e.message || "Failed to delete image");
  } finally {
    deleting.value = false;
  }
};

// Refetch image data after layout operations
const refetchImage = async () => {
  if (!props.image?.instanceId) return;

  try {
    const response = await $fetch<{
      image: DisplayImage;
      layout_removed?: boolean;
      group_was_removed?: boolean;
    }>(`/api/images/${props.image.instanceId}`, {
      headers: useRequestHeaders(["cookie"]),
    });

    if (response.image) {
      emit("refresh");
      await nextTick();
      emit("updated");
    }
  } catch (error) {
    console.error("Failed to refetch image:", error);
  }
};

// Handle layout assigned from LayoutWizard
const handleLayoutAssigned = async () => {
  await refetchImage();
  success("Layout assigned successfully");
};

// Handle layout removed from the LayoutWizard
const handleLayoutRemoved = async () => {
  await refetchImage();
  success("Layout removed successfully");
};
</script>
