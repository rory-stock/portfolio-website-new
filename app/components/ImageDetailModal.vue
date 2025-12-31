<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
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
                <span class="ml-2 text-neutral-100"
                  >{{ image.width }} × {{ image.height }}</span
                >
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
                  formatDate(image.uploaded_at)
                }}</span>
              </div>
            </div>

            <!-- Editable fields -->
            <form
              @submit.prevent="handleSave"
              class="no-scrollbar space-y-4 overflow-y-auto px-1"
            >
              <div v-for="field in fields" :key="field.key" class="space-y-1">
                <label
                  :for="field.key"
                  class="block font-medium text-neutral-100"
                >
                  {{ field.label }}
                </label>

                <textarea
                  v-if="field.type === 'textarea'"
                  :id="field.key"
                  v-model="formData[field.key]"
                  :rows="field.rows || 5"
                  :placeholder="field.placeholder"
                  class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 transition-colors duration-200 hover:bg-neutral-700 focus:bg-neutral-700 focus:outline-0"
                />

                <input
                  v-else
                  :id="field.key"
                  :type="field.type || 'text'"
                  v-model="formData[field.key]"
                  :placeholder="field.placeholder"
                  class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 transition-colors duration-200 hover:bg-neutral-700 focus:bg-neutral-700 focus:outline-0"
                />
              </div>

              <!-- Toggle Switch for is_public -->
              <div class="flex items-center justify-between">
                <div>
                  <label for="is_public" class="font-medium text-neutral-100">
                    Public Visibility
                  </label>
                  <p class="text-sm text-neutral-400">
                    Allow viewing without authentication
                  </p>
                </div>
                <button
                  id="is_public"
                  type="button"
                  role="switch"
                  :aria-checked="formData.is_public"
                  @click="togglePublic"
                  @keydown.space.prevent="togglePublic"
                  @keydown.enter.prevent="togglePublic"
                  class="relative inline-flex h-6 w-12 cursor-pointer items-center rounded-full transition-colors focus:outline-0"
                  :class="
                    formData.is_public ? 'bg-neutral-100' : 'bg-neutral-700'
                  "
                >
                  <span
                    class="inline-block h-5 w-5 transform rounded-full bg-neutral-980 transition-transform"
                    :class="
                      formData.is_public ? 'translate-x-6' : 'translate-x-1'
                    "
                  />
                </button>
              </div>

              <!-- Context selection dropdown -->
              <div class="relative mb-4">
                <label class="mb-1 block font-medium text-neutral-100">
                  Contexts
                </label>

                <div v-if="isLoadingContexts" class="text-sm text-neutral-500">
                  Loading...
                </div>

                <div v-else ref="contextDropdownRef" class="relative">
                  <!-- Dropdown trigger -->
                  <button
                    type="button"
                    @click="toggleDropdown"
                    class="flex w-full items-center justify-between rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 transition-colors duration-200 hover:bg-neutral-700 focus:outline-0"
                    :aria-expanded="isContextDropdownOpen"
                    aria-haspopup="listbox"
                  >
                    <span>Select Contexts</span>
                    <Icon
                      name="chevron"
                      width="21"
                      height="21"
                      class="transition-transform duration-200"
                      :class="{ 'rotate-180': isContextDropdownOpen }"
                      aria-hidden="true"
                    />
                  </button>

                  <!-- Dropdown menu -->
                  <Transition
                    enter-active-class="transition-all duration-200"
                    enter-from-class="opacity-0 scale-95"
                    enter-to-class="opacity-100 scale-100"
                    leave-active-class="transition-all duration-150"
                    leave-from-class="opacity-100 scale-100"
                    leave-to-class="opacity-0 scale-95"
                  >
                    <div
                      v-if="isContextDropdownOpen"
                      class="absolute z-50 mt-1 mb-4 w-full rounded-lg border border-neutral-700 bg-neutral-800 py-1"
                      role="listbox"
                      aria-label="Context options"
                    >
                      <label
                        v-for="ctx in availableContexts"
                        :key="ctx"
                        class="mx-2 flex cursor-pointer items-center rounded-lg px-3 py-2 hover:bg-neutral-700"
                        role="option"
                        :aria-selected="allImageContexts.includes(ctx)"
                      >
                        <span
                          class="relative mr-3 flex h-5 w-5 shrink-0 items-center justify-center"
                        >
                          <input
                            type="checkbox"
                            :value="ctx"
                            v-model="allImageContexts"
                            :disabled="
                              allImageContexts.length === 1 &&
                              allImageContexts.includes(ctx)
                            "
                            class="peer absolute h-5 w-5 cursor-pointer appearance-none rounded border-2 border-neutral-600 bg-neutral-800 transition-all duration-200 checked:border-neutral-100 checked:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                          <Icon
                            name="check"
                            :size="20"
                            stroke="black"
                            :strokeWidth="1"
                            class="pointer-events-none absolute text-neutral-900 opacity-0 transition-opacity duration-200 peer-checked:opacity-100"
                          />
                        </span>
                        <span class="text-sm text-neutral-100 capitalize">{{
                          ctx
                        }}</span>
                      </label>
                    </div>
                  </Transition>
                </div>
              </div>

              <!-- Layout Configuration -->
              <LayoutWizard
                v-if="props.image && props.showLayoutWizard"
                :current-image="props.image"
                :all-images="props.allImages"
                :context="props.context"
                @layout-assigned="handleLayoutAssigned"
                @layout-removed="handleLayoutRemoved"
              />

              <!-- Action buttons -->
              <div
                class="flex flex-col gap-2 border-t border-neutral-800 pt-4 md:flex-row md:gap-3"
              >
                <AppButton
                  type="submit"
                  :disabled="!hasChanges || saving"
                  :loading="saving"
                >
                  <template #loading>Saving...</template>
                  Save Changes
                </AppButton>
                <AppButton
                  variant="secondary"
                  type="button"
                  @click="handleDiscard"
                  :disabled="!hasChanges || saving"
                >
                  Discard Changes
                </AppButton>
                <AppButton
                  variant="danger"
                  type="button"
                  @click="handleDelete"
                  :disabled="deleting"
                  :loading="deleting"
                  class="mt-6 md:mt-0 md:ml-auto"
                >
                  <template #loading>Deleting...</template>
                  Delete Image
                </AppButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { ImageBase, ImageField } from "~~/types/imageTypes";
import { onClickOutside, onKeyStroke } from "@vueuse/core";
import { formatFileSize, formatDate } from "~/utils/format";

interface Props {
  open: boolean;
  image: ImageBase | null;
  fields: ImageField[];
  allImages: ImageBase[];
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

const isContextDropdownOpen = ref(false);

const toggleDropdown = () => {
  isContextDropdownOpen.value = !isContextDropdownOpen.value;
};
const contextDropdownRef = ref(null);
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

// Close dropdown when clicking outside
onClickOutside(contextDropdownRef, () => {
  isContextDropdownOpen.value = false;
});

// Close modal on Escape key
onKeyStroke("Escape", (e) => {
  if (props.open && !isContextDropdownOpen.value) {
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

const togglePublic = () => {
  formData.value.is_public = !formData.value.is_public;
};

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

    await $fetch(`/api/images/${props.image.id}`, {
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
    await $fetch(`/api/images/${props.image.id}`, {
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
  if (!props.image?.id) return;

  try {
    const response = await $fetch<{
      image: ImageBase;
      layout_removed?: boolean;
      group_was_removed?: boolean;
    }>(`/api/images/${props.image.id}`, {
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
