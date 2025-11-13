<template>
  <Teleport to="body">
    <div
      v-if="open && image"
      class="bg-opacity-75 fixed inset-0 z-50 flex items-center justify-center bg-black"
      @click.self="$emit('close')"
    >
      <div
        class="m-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-neutral-800 p-6"
        >
          <h3 class="text-xl font-bold text-neutral-100">Image Details</h3>
          <button
            @click="$emit('close')"
            class="cursor-pointer text-2xl text-neutral-400 hover:text-neutral-200"
          >
            ×
          </button>
        </div>

        <!-- Content -->
        <div class="space-y-6 p-6">
          <!-- Image preview -->
          <div class="flex justify-center rounded bg-neutral-950 p-4">
            <NuxtPicture
              :src="`${image.r2_path}`"
              :alt="image.alt"
              format="webp"
              class="max-h-1/12 object-contain"
            />
          </div>

          <!-- Metadata -->
          <div class="grid grid-cols-2 gap-4 text-sm">
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
              <span class="text-neutral-400">Filename:</span>
              <span class="ml-2 text-neutral-100">{{
                image.original_filename
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
          <form @submit.prevent="handleSave" class="space-y-4">
            <div v-for="field in fields" :key="field.key" class="space-y-1">
              <label
                :for="field.key"
                class="block font-medium text-neutral-200"
              >
                {{ field.label }}
              </label>

              <textarea
                v-if="field.type === 'textarea'"
                :id="field.key"
                v-model="formData[field.key]"
                :rows="field.rows || 5"
                :placeholder="field.placeholder"
                class="w-full rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-100"
              />

              <input
                v-else
                :id="field.key"
                :type="field.type || 'text'"
                v-model="formData[field.key]"
                :placeholder="field.placeholder"
                class="w-full rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-100"
              />
            </div>

            <!-- Toggle Switch for is_public -->
            <div class="flex items-center justify-between">
              <div>
                <label for="is_public" class="font-medium text-neutral-200">
                  Public Visibility
                </label>
                <p class="text-sm text-neutral-400">
                  Allow viewing without authentication
                </p>
              </div>
              <button
                type="button"
                role="switch"
                :aria-checked="formData.is_public"
                @click="formData.is_public = !formData.is_public"
                class="relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors"
                :class="formData.is_public ? 'bg-blue-600' : 'bg-neutral-700'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="
                    formData.is_public ? 'translate-x-6' : 'translate-x-1'
                  "
                />
              </button>
            </div>

            <!-- Action buttons -->
            <div class="flex gap-3 border-t border-neutral-800 pt-4">
              <button
                type="submit"
                :disabled="!hasChanges || saving"
                class="cursor-pointer rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {{ saving ? "Saving..." : "Save Changes" }}
              </button>
              <button
                type="button"
                @click="handleDiscard"
                :disabled="!hasChanges || saving"
                class="cursor-pointer rounded border border-neutral-700 px-4 py-2 text-neutral-200 hover:bg-neutral-800 disabled:opacity-50"
              >
                Discard Changes
              </button>
              <button
                type="button"
                @click="handleDelete"
                :disabled="deleting"
                class="ml-auto cursor-pointer rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {{ deleting ? "Deleting..." : "Delete Image" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
interface Field {
  key: string;
  label: string;
  type?: "text" | "textarea" | "email" | "url";
  rows?: number;
  placeholder?: string;
}

interface Image {
  id: number;
  r2_path: string;
  url: string;
  alt: string;
  description: string;
  width: number;
  height: number;
  file_size: number;
  original_filename: string;
  uploaded_at: string | Date;
  is_public: boolean;
}

interface Props {
  open: boolean;
  image: Image | null;
  fields: Field[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  updated: [];
  deleted: [];
}>();

const { success, error: showError } = useToast();

const saving = ref(false);
const deleting = ref(false);

const originalData = ref<Record<string, any>>({
  is_public: false,
});

const formData = ref<Record<string, any>>({
  is_public: false,
});

const hasChanges = computed(() => {
  // Check field-based changes
  const fieldChanged = props.fields.some(
    (field) => formData.value[field.key] !== originalData.value[field.key]
  );

  // Check is_public change
  const publicChanged =
    formData.value.is_public !== originalData.value.is_public;

  return fieldChanged || publicChanged;
});

watch(
  () => props.image,
  (newImage) => {
    if (newImage) {
      // Initialize with field values
      const data: Record<string, any> = {
        is_public: newImage.is_public,
      };

      for (const field of props.fields) {
        data[field.key] = (newImage as any)[field.key] || "";
      }

      originalData.value = { ...data };
      formData.value = { ...data };
    }
  },
  { immediate: true }
);

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

    await $fetch(`/api/images/${props.image.id}`, {
      method: "PATCH",
      body,
    });

    originalData.value = { ...formData.value };
    success("Image updated successfully");
    emit("updated");
  } catch (e: any) {
    showError(e.message || "Failed to update image");
  } finally {
    saving.value = false;
  }
};

const handleDiscard = () => {
  formData.value = { ...originalData.value };
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
</script>
