<script setup lang="ts">
interface DisplayImage {
  id: number;
  instance_id: number;
  url: string;
  alt: string;
  width: number;
  height: number;
  file_size: number;
  original_filename: string;
  captured_at: string | null;
  description: string | null;
  is_public: boolean;
  context: string;
}

const props = defineProps<{
  image: DisplayImage | null;
  folderId: number;
  isCover?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  removed: [imageInstanceId: number];
  "set-cover": [imageInstanceId: number];
  updated: [];
}>();

const editAlt = ref("");
const editDescription = ref("");
const saving = ref(false);
const removing = ref(false);
const hasChanges = ref(false);

// Sync form fields when the image changes
watch(
  () => props.image,
  (img) => {
    if (img) {
      editAlt.value = img.alt || "";
      editDescription.value = img.description || "";
      hasChanges.value = false;
    }
  },
  { immediate: true }
);

function onFieldChange() {
  if (!props.image) return;
  hasChanges.value =
    editAlt.value !== (props.image.alt || "") ||
    editDescription.value !== (props.image.description || "");
}

async function save() {
  if (!props.image || !hasChanges.value) return;
  saving.value = true;

  try {
    await $fetch(`/api/admin/images/${props.image.id}`, {
      method: "PATCH",
      body: {
        alt: editAlt.value,
        description: editDescription.value,
      },
    });
    hasChanges.value = false;
    emit("updated");
  } catch (error: any) {
    console.error("Failed to save:", error);
  } finally {
    saving.value = false;
  }
}

async function removeFromFolder() {
  if (!props.image) return;
  removing.value = true;

  try {
    await $fetch(
      `/api/folders/${props.folderId}/images/${props.image.instance_id}`,
      { method: "DELETE" }
    );
    emit("removed", props.image.instance_id);
    emit("close");
  } catch (error: any) {
    console.error("Failed to remove:", error);
  } finally {
    removing.value = false;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-NZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) emit("close");
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") emit("close");
}

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="image"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      @click="handleBackdropClick"
    >
      <div
        class="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 md:flex-row"
      >
        <!-- Image preview -->
        <div class="flex flex-1 items-center justify-center bg-neutral-900 p-4">
          <img
            :src="image.url"
            :alt="image.alt"
            class="max-h-[50vh] w-auto rounded object-contain md:max-h-[80vh]"
          />
        </div>

        <!-- Sidebar -->
        <div
          class="flex w-full flex-col border-t border-neutral-800 md:w-80 md:border-t-0 md:border-l"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between border-b border-neutral-800 p-4"
          >
            <h3 class="truncate text-sm font-medium text-neutral-100">
              {{ image.original_filename }}
            </h3>
            <button
              class="text-neutral-500 hover:text-neutral-300"
              @click="emit('close')"
            >
              ✕
            </button>
          </div>

          <!-- Scrollable content -->
          <div class="flex-1 space-y-4 overflow-y-auto p-4">
            <!-- Info -->
            <div class="space-y-1 text-xs text-neutral-500">
              <p>
                {{ image.width }}×{{ image.height }} ·
                {{ formatFileSize(image.file_size) }}
              </p>
              <p v-if="image.captured_at">
                Captured: {{ formatDate(image.captured_at) }}
              </p>
            </div>

            <!-- Cover badge / button -->
            <div>
              <span
                v-if="isCover"
                class="inline-block rounded bg-amber-600 px-2 py-0.5 text-xs font-medium text-white"
              >
                Cover image
              </span>
              <button
                v-else
                class="rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:border-neutral-500 hover:text-white"
                @click="emit('set-cover', image.instance_id)"
              >
                Set as cover
              </button>
            </div>

            <!-- Alt text -->
            <div>
              <label class="mb-1 block text-xs text-neutral-400">
                Alt text
              </label>
              <input
                v-model="editAlt"
                type="text"
                class="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none"
                placeholder="Describe this image"
                @input="onFieldChange"
              />
            </div>

            <!-- Description -->
            <div>
              <label class="mb-1 block text-xs text-neutral-400">
                Description
              </label>
              <textarea
                v-model="editDescription"
                rows="3"
                class="w-full resize-none rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none"
                placeholder="Optional description"
                @input="onFieldChange"
              />
            </div>
          </div>

          <!-- Actions footer -->
          <div
            class="flex items-center justify-between border-t border-neutral-800 p-4"
          >
            <!-- Remove from folder -->
            <button
              :disabled="removing"
              class="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-950/50 hover:text-red-300 disabled:opacity-50"
              @click="removeFromFolder"
            >
              {{ removing ? "Removing..." : "Remove" }}
            </button>

            <!-- Save -->
            <button
              :disabled="!hasChanges || saving"
              class="rounded bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-950 transition-colors hover:bg-white disabled:opacity-30"
              @click="save"
            >
              {{ saving ? "Saving..." : "Save" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
