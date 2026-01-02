<script setup lang="ts">
import { ref, computed } from "vue";
import { useDropZone } from "@vueuse/core";
import { useFileUpload } from "~/composables/useFileUpload";
import { formatFileSize } from "~/utils/format";

const props = defineProps<{
  context: string;
}>();

const emit = defineEmits<{
  uploaded: [];
}>();

const {
  state,
  hasInvalidFiles,
  hasValidFiles,
  canUpload,
  selectFiles,
  startUpload,
  cancelUpload,
  clearInvalidFiles,
  skipInvalidAndUpload,
  clearCompleted,
  reset,
} = useFileUpload({
  context: props.context,
  onComplete: () => {
    emit("uploaded");
    clearCompleted();
  },
});

// File input ref
const fileInputRef = ref<HTMLInputElement | null>(null);
const dropZoneRef = ref<HTMLDivElement | null>(null);

// Drop zone setup
const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop(files) {
    if (files && !state.isUploading) {
      selectFiles(Array.from(files));

      // Auto-start if no invalid files
      if (!hasInvalidFiles.value && hasValidFiles.value) {
        startUpload();
      }
    }
  },
  dataTypes: ["image/jpeg", "image/png", "image/webp"],
});

// Computed classes for drop zone
const dropZoneClasses = computed(() => [
  "relative rounded-lg p-8 transition-all text-center",
  "border-2",
  isOverDropZone.value
    ? "border-solid border-neutral-500 bg-neutral-800"
    : "border-dashed border-neutral-700",
]);

// File input handling
function triggerFileInput() {
  fileInputRef.value?.click();
}

function handleFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    selectFiles(Array.from(input.files));

    // Auto-start if no invalid files
    if (!hasInvalidFiles.value && hasValidFiles.value) {
      startUpload();
    }
  }
  // Reset input value to allow selecting the same files again
  input.value = "";
}

// Progress bar width
const progressWidth = computed(() => {
  if (state.progress.total === 0) return "0%";
  const percentage = (state.progress.completed / state.progress.total) * 100;
  return `${percentage}%`;
});

// Status helpers
function getStatusDotColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-neutral-500";
    case "uploading":
      return "bg-blue-500";
    case "success":
      return "bg-green-500";
    case "error":
      return "bg-red-500";
    case "cancelled":
      return "bg-neutral-500";
    default:
      return "bg-neutral-500";
  }
}

function getStatusText(file: any): string {
  switch (file.status) {
    case "pending":
      return "Pending";
    case "uploading":
      return `Uploading... ${file.progress}%`;
    case "success":
      return "Uploaded ✓";
    case "error":
      return `Failed: ${file.error}`;
    case "cancelled":
      return "Cancelled";
    default:
      return "";
  }
}

// Summary text
const summaryText = computed(() => {
  if (!state.summary) return "";
  const parts = [];
  if (state.summary.succeeded > 0)
    parts.push(`${state.summary.succeeded} uploaded`);
  if (state.summary.failed > 0) parts.push(`${state.summary.failed} failed`);
  if (state.summary.cancelled > 0)
    parts.push(`${state.summary.cancelled} cancelled`);
  return parts.join(", ");
});

// Handle cancel all (when invalid files present)
function handleCancelAll() {
  clearInvalidFiles();
  reset();
}
</script>

<template>
  <div ref="dropZoneRef" :class="dropZoneClasses">
    <!-- Invalid Files Alert -->
    <div
      v-if="hasInvalidFiles"
      class="mb-4 rounded-lg border border-red-500 bg-red-950/50 p-4 text-left"
    >
      <h3 class="mb-2 text-sm font-semibold text-neutral-100 lg:text-base">
        Some files cannot be uploaded
      </h3>
      <div class="mb-3 max-h-40 space-y-2 overflow-y-auto text-xs lg:text-sm">
        <div
          v-for="(invalid, index) in state.invalidFiles"
          :key="index"
          class="text-neutral-200"
        >
          <span class="font-medium">{{ invalid.file.name }}</span>
          <span class="text-neutral-400">
            ({{ formatFileSize(invalid.file.size) }})</span
          >
          <ul class="mt-1 ml-4 list-disc text-[0.7rem] text-red-400 lg:text-xs">
            <li v-for="(reason, idx) in invalid.reasons" :key="idx">
              {{ reason }}
            </li>
          </ul>
        </div>
      </div>
      <div class="flex flex-col gap-3 md:flex-row">
        <AppButton
          v-if="hasValidFiles"
          @click="skipInvalidAndUpload"
          class="text-xs font-medium"
        >
          Skip invalid & continue ({{ state.files.length }} valid)
        </AppButton>
        <AppButton
          v-if="hasValidFiles"
          @click="skipInvalidAndUpload"
          class="text-xs font-medium"
        >
          Skip invalid & continue ({{ state.files.length }} valid)
        </AppButton>
      </div>
    </div>

    <!-- Cancelling Banner -->
    <div
      v-if="state.isCancelling"
      class="mb-4 rounded-lg border border-amber-500 bg-amber-950/50 p-3 text-left text-xs text-amber-300"
    >
      <span class="font-medium">Cancelling uploads...</span>
    </div>

    <!-- Upload Trigger (when not uploading and no summary) -->
    <div v-if="!state.isUploading && !state.summary">
      <input
        ref="fileInputRef"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        class="hidden"
        @change="handleFileInputChange"
      />

      <p class="mb-4 text-[0.92rem] text-neutral-300 md:text-base">
        Drop images here or click to browse
      </p>

      <AppButton type="button" @click="triggerFileInput">
        Select Files
      </AppButton>

      <p class="mt-3 text-xs text-neutral-500">
        JPG, PNG, WebP • Max 60MB per file
      </p>
    </div>

    <!-- Progress Section (when uploading) -->
    <div v-if="state.isUploading">
      <!-- Progress Bar -->
      <div class="mb-4">
        <div
          class="mb-2 h-2 w-full overflow-hidden rounded-full bg-neutral-800"
        >
          <div
            class="h-full bg-blue-600 transition-all duration-300"
            :style="{ width: progressWidth }"
          />
        </div>
        <p class="text-center text-[0.92rem] text-neutral-300 md:text-base">
          {{ state.progress.completed }} of {{ state.progress.total }} files
        </p>
      </div>

      <!-- File List -->
      <div
        class="mb-4 max-h-96 space-y-2 overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900 p-3"
      >
        <div
          v-for="file in state.files"
          :key="file.id"
          class="flex items-start gap-3 text-xs"
        >
          <!-- Status Dot -->
          <div class="mt-1 shrink-0">
            <div
              :class="[
                'h-2 w-2 rounded-full',
                getStatusDotColor(file.status),
                file.status === 'uploading' ? 'animate-pulse' : '',
              ]"
            />
          </div>

          <!-- File Info -->
          <div class="min-w-0 flex-1 text-left">
            <div class="flex items-center gap-2">
              <span class="truncate font-medium text-neutral-100">
                {{ file.fileName }}
              </span>
              <span class="shrink-0 text-[0.7rem] text-neutral-500">
                ({{ formatFileSize(file.fileSize) }})
              </span>
              <!-- Large file warning -->
              <div
                v-if="file.isLargeFile && file.status === 'pending'"
                class="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                title="Large file - may take longer to upload"
              />
            </div>
            <div
              :class="[
                'mt-0.5 text-[0.7rem]',
                file.status === 'error' ? 'text-red-400' : 'text-neutral-400',
              ]"
            >
              {{ getStatusText(file) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Cancel Button -->
      <div class="text-center">
        <AppButton
          v-if="!state.isCancelling"
          variant="secondary"
          @click="cancelUpload"
          class="rounded-lg text-xs font-medium"
        >
          Cancel Upload
        </AppButton>
      </div>
    </div>

    <!-- Summary (after upload completes) -->
    <div v-if="state.summary && !state.isUploading" class="text-center">
      <div class="mb-4 rounded-lg border border-neutral-700 bg-neutral-800 p-4">
        <p class="mb-1 text-sm font-semibold text-neutral-100">
          Upload {{ state.summary.cancelled > 0 ? "cancelled" : "complete" }}
        </p>
        <p class="text-xs text-neutral-300">
          {{ summaryText }}
        </p>
      </div>

      <!-- Show file list if there were failures -->
      <div
        v-if="state.summary.failed > 0 || state.summary.cancelled > 0"
        class="mb-4 max-h-60 space-y-2 overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-left"
      >
        <div
          v-for="file in state.files"
          :key="file.id"
          class="flex items-start gap-3 text-xs"
        >
          <div class="mt-1 shrink-0">
            <div
              :class="['h-2 w-2 rounded-full', getStatusDotColor(file.status)]"
            />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="truncate font-medium text-neutral-100">
                {{ file.fileName }}
              </span>
              <span class="shrink-0 text-[0.7rem] text-neutral-500">
                ({{ formatFileSize(file.fileSize) }})
              </span>
            </div>
            <div
              :class="[
                'mt-0.5 text-[0.7rem]',
                file.status === 'error' ? 'text-red-400' : 'text-neutral-400',
              ]"
            >
              {{ getStatusText(file) }}
            </div>
          </div>
        </div>
      </div>

      <AppButton @click="reset" class="text-xs font-medium">Close</AppButton>
    </div>
  </div>
</template>
