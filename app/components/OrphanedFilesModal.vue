<script setup lang="ts">
import {
  useAsyncState,
  useToggle,
  onKeyStroke,
  useScrollLock,
} from "@vueuse/core";

interface OrphanedFile {
  key: string;
  size: number;
  lastModified: string;
}

interface OrphanedResponse {
  orphaned: OrphanedFile[];
  total: number;
}

const isOpen = defineModel<boolean>({ required: true });
const { success, error: showError } = useToast();

const modalState = useModalState();
if (modalState) {
  watch(isOpen, (value) => {
    modalState.isCleanupModalOpen.value = value;
  });
}

const [showConfirmation, toggleConfirmation] = useToggle(false);
const isDeleting = ref(false);

// Fetch orphaned files
const {
  state: orphanedFiles,
  isLoading,
  error,
  execute: fetchOrphanedFiles,
} = useAsyncState(
  async () => {
    const data = await $fetch<OrphanedResponse>("/api/orphaned");
    return data.orphaned;
  },
  [] as OrphanedFile[],
  {
    immediate: false,
    onError: (e) => {
      console.error("Failed to fetch orphaned files:", e);
      showError("Failed to load orphaned files. Please try again.");
    },
  }
);

// Lock body scroll when modal is open
const isLocked = useScrollLock(document?.body);
watch(isOpen, (open) => {
  isLocked.value = open;
  if (open) {
    fetchOrphanedFiles();
  } else {
    // Reset state when modal closes
    showConfirmation.value = false;
    error.value = null;
  }
});

// Close on Escape key
onKeyStroke("Escape", () => {
  if (isOpen.value) {
    if (showConfirmation.value) {
      // Cancel confirmation first
      toggleConfirmation(false);
    } else {
      // Close modal
      closeModal();
    }
  }
});

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString();
}

function getFileName(path: string): string {
  return path.split("/").pop() || path;
}

function isImageFile(path: string): boolean {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"];
  return imageExtensions.some((ext) => path.toLowerCase().endsWith(ext));
}

async function handleDeleteAll() {
  if (orphanedFiles.value.length === 0) return;

  isDeleting.value = true;

  try {
    await $fetch("/api/cleanup", {
      method: "DELETE",
    });

    success("Orphaned files deleted successfully");

    // Refresh the list after successful deletion
    await fetchOrphanedFiles();
    toggleConfirmation(false);

    // Close modal if all files were deleted successfully
    if (orphanedFiles.value.length === 0) {
      isOpen.value = false;
    }
  } catch (e) {
    console.error("Failed to delete orphaned files:", e);
    showError("Failed to delete files. Please try again.");
  } finally {
    isDeleting.value = false;
  }
}

function closeModal() {
  isOpen.value = false;
}

// Shared button classes
const primaryButtonClass =
  "cursor-pointer rounded-lg bg-neutral-980 px-4 py-2 text-[0.92rem] text-neutral-100 transition-colors hover:bg-neutral-800 md:text-base";
const secondaryButtonClass =
  "cursor-pointer rounded-lg bg-neutral-300 px-4 py-2 text-neutral-900 transition-colors hover:bg-neutral-400 disabled:cursor-not-allowed disabled:opacity-50";
const dangerButtonClass =
  "cursor-pointer rounded-lg bg-red-800 px-4 py-2 text-neutral-100 transition-colors hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-50";
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="closeModal"
      >
        <div
          class="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-neutral-100 shadow-xl sm:max-h-[80vh]"
        >
          <!-- Header -->
          <div
            class="sticky top-0 flex items-center justify-between rounded-t-lg border-b bg-neutral-100 px-6 py-4"
          >
            <div class="flex items-center gap-3">
              <Icon name="cleanup" class="h-6 w-6" />
              <h2 class="text-xl font-semibold">Orphaned Files</h2>
            </div>
            <button
              @click="closeModal"
              class="cursor-pointer rounded-lg bg-neutral-400 p-2 transition-colors duration-200 hover:bg-neutral-500 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="isDeleting"
              aria-label="Close modal"
            >
              <Icon name="cross" class="h-5 w-5" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <!-- Loading State -->
            <div
              v-if="isLoading"
              class="flex flex-col items-center justify-center gap-3 py-12"
            >
              <div
                class="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-980"
              ></div>
              <p class="text-neutral-600">Loading orphaned files...</p>
            </div>

            <!-- Error State -->
            <div
              v-else-if="error"
              class="flex flex-col items-center justify-center gap-3 pt-12 pb-2"
            >
              <p class="text-[0.92rem] text-red-600 md:text-base">
                {{ String(error) || "Failed to load orphaned files" }}
              </p>
              <button
                @click="() => fetchOrphanedFiles()"
                :class="primaryButtonClass"
                :disabled="isLoading"
              >
                {{ isLoading ? "Loading..." : "Try Again" }}
              </button>
            </div>

            <!-- Empty State -->
            <div
              v-else-if="orphanedFiles.length === 0"
              class="flex flex-col items-center justify-center gap-3 py-12"
            >
              <Icon name="smile" class="h-16 w-16 text-gray-400" />
              <p class="text-lg text-neutral-600">No orphaned files found!</p>
              <p class="text-sm text-neutral-500">
                All your files are properly referenced.
              </p>
            </div>

            <!-- File List -->
            <div v-else class="space-y-3">
              <div
                v-for="file in orphanedFiles"
                :key="file.key"
                class="flex items-center gap-4 rounded-lg border border-neutral-900 bg-neutral-50 p-3 transition-colors hover:bg-neutral-100"
              >
                <!-- Thumbnail -->
                <div
                  class="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-neutral-200"
                >
                  <NuxtPicture
                    v-if="isImageFile(file.key)"
                    :src="file.key"
                    :alt="getFileName(file.key)"
                    :img-attrs="{ class: 'w-full h-full object-cover' }"
                  />
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center"
                  >
                    <Icon name="file" class="h-6 w-6 text-neutral-400" />
                  </div>
                </div>

                <!-- File Details -->
                <div class="min-w-0 flex-1">
                  <p
                    class="truncate font-medium text-neutral-900"
                    :title="file.key"
                  >
                    {{ getFileName(file.key) }}
                  </p>
                  <div class="flex items-center gap-3 text-sm text-neutral-600">
                    <span>{{ formatFileSize(file.size) }}</span>
                    <span class="text-neutral-400">•</span>
                    <span>{{ formatDate(file.lastModified) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            v-if="orphanedFiles.length > 0 && !isLoading"
            class="sticky bottom-0 rounded-b-lg border-t bg-neutral-100 px-6 py-4"
          >
            <!-- Confirmation View -->
            <Transition
              enter-active-class="transition-all duration-200"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-150"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
              mode="out-in"
            >
              <div v-if="showConfirmation" class="space-y-3">
                <p class="text-center text-neutral-900">
                  Are you sure you want to delete
                  <strong>{{ orphanedFiles.length }}</strong>
                  orphaned {{ orphanedFiles.length === 1 ? "file" : "files" }}?
                </p>
                <p class="text-center text-sm text-red-700">
                  This action cannot be undone.
                </p>
                <div class="flex gap-3">
                  <button
                    @click="toggleConfirmation(false)"
                    :class="[secondaryButtonClass, 'flex-1']"
                    :disabled="isDeleting"
                  >
                    Cancel
                  </button>
                  <button
                    @click="handleDeleteAll"
                    :class="[dangerButtonClass, 'flex-1']"
                    :disabled="isDeleting"
                  >
                    <span v-if="isDeleting">Deleting...</span>
                    <span v-else>Delete All</span>
                  </button>
                </div>
              </div>

              <!-- Delete Button -->
              <button
                v-else
                @click="toggleConfirmation(true)"
                :class="[dangerButtonClass, 'w-full']"
                :disabled="isDeleting"
              >
                Delete All Orphaned Files ({{ orphanedFiles.length }})
              </button>
            </Transition>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.2s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}
</style>
