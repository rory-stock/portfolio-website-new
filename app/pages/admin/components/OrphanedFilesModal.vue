<script setup lang="ts">
import {
  useAsyncState,
  useToggle,
  onKeyStroke,
  useScrollLock,
} from "@vueuse/core";
import { formatDateRelative, formatFileSize } from "~/utils/format";

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

// Close on the Escape key
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
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-4"
        @click.self="closeModal"
      >
        <div
          class="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-neutral-700 bg-neutral-900 sm:max-h-[80vh]"
        >
          <!-- Header -->
          <div
            class="sticky top-0 flex items-center justify-between rounded-t-lg border-b border-neutral-700 bg-neutral-900 px-6 py-4"
          >
            <div class="flex items-center gap-3 text-neutral-200">
              <Icon name="cleanup" class="h-6 w-6" />
              <h2 class="text-xl font-semibold">Orphaned Files</h2>
            </div>
            <AppButton
              variant="secondary"
              @click="closeModal"
              :disabled="isDeleting"
              aria-label="Close modal"
            >
              <Icon name="cross" class="h-5 w-5" />
            </AppButton>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <!-- Loading State -->
            <div
              v-if="isLoading"
              class="flex flex-col items-center justify-center gap-3 py-12"
            >
              <div
                class="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-600"
              ></div>
              <p class="text-neutral-200">Loading orphaned files...</p>
            </div>

            <!-- Error State -->
            <div
              v-else-if="error"
              class="flex flex-col items-center justify-center gap-3 py-12"
            >
              <p class="text-[0.92rem] font-medium text-red-600 md:text-base">
                {{ String(error) || "Failed to load orphaned files" }}
              </p>
              <AppButton
                @click="() => fetchOrphanedFiles()"
                :disabled="isLoading"
                :loading="isLoading"
              >
                Try Again
              </AppButton>
            </div>

            <!-- Empty State -->
            <div
              v-else-if="orphanedFiles.length === 0"
              class="flex flex-col items-center justify-center gap-3 py-12"
            >
              <p class="text-lg text-neutral-200">No orphaned files found!</p>
              <p class="text-sm text-neutral-400">
                All your files are properly referenced.
              </p>
            </div>

            <!-- File List -->
            <div v-else class="space-y-3">
              <div
                v-for="file in orphanedFiles"
                :key="file.key"
                class="flex items-center gap-4 rounded-lg border border-neutral-700 bg-neutral-800 p-3 transition-colors duration-300 hover:bg-neutral-700"
              >
                <!-- Thumbnail -->
                <div
                  class="h-12 w-12 shrink-0 overflow-hidden rounded bg-neutral-700"
                >
                  <NuxtPicture
                    v-if="isImageFile(file.key)"
                    :src="file.key"
                    :alt="getFileName(file.key)"
                    :imgAttrs="{ class: 'w-full h-full object-cover' }"
                  />
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center"
                  >
                    <Icon name="file" class="h-6 w-6 text-neutral-200" />
                  </div>
                </div>

                <!-- File Details -->
                <div class="min-w-0 flex-1">
                  <p
                    class="truncate font-medium text-neutral-200"
                    :title="file.key"
                  >
                    {{ getFileName(file.key) }}
                  </p>
                  <div class="flex items-center gap-3 text-sm text-neutral-500">
                    <span>{{ formatFileSize(file.size) }}</span>
                    <span class="text-neutral-400">•</span>
                    <span>{{ formatDateRelative(file.lastModified) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            v-if="orphanedFiles.length > 0 && !isLoading"
            class="sticky bottom-0 rounded-b-lg border-t border-neutral-700 bg-neutral-900 px-6 py-4"
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
                <p class="text-center text-neutral-200">
                  Are you sure you want to delete
                  <strong>{{ orphanedFiles.length }}</strong>
                  orphaned {{ orphanedFiles.length === 1 ? "file" : "files" }}?
                </p>
                <p class="text-center text-sm font-medium text-red-700">
                  This action cannot be undone.
                </p>
                <div
                  class="flex flex-col justify-between gap-2 md:flex-row md:gap-3"
                >
                  <AppButton
                    variant="secondary"
                    @click="toggleConfirmation(false)"
                    :disabled="isDeleting"
                    class="w-full"
                  >
                    Cancel
                  </AppButton>
                  <AppButton
                    variant="danger"
                    @click="handleDeleteAll"
                    :disabled="isDeleting"
                    :loading="isDeleting"
                    class="w-full"
                  >
                    <template #loading>Deleting...</template>
                    Delete All
                  </AppButton>
                </div>
              </div>

              <!-- Delete Button -->
              <AppButton
                v-else
                variant="danger"
                @click="toggleConfirmation(true)"
                :disabled="isDeleting"
                class="w-full"
              >
                Delete All Orphaned Files ({{ orphanedFiles.length }})
              </AppButton>
            </Transition>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
