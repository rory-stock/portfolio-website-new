<script setup lang="ts">
import type { UploadFile, InvalidFile } from "~/composables/useFileUpload";
import { formatFileSize } from "~/utils/format";

defineProps<{
  files: UploadFile[];
  invalidFiles: InvalidFile[];
  hasInvalidFiles: boolean;
  hasValidFiles: boolean;
  isUploading: boolean;
  isCancelling: boolean;
  progress: {
    completed: number;
    total: number;
  };
  summary: {
    succeeded: number;
    failed: number;
    cancelled: number;
  } | null;
}>();

const emit = defineEmits<{
  cancel: [];
  close: [];
  skipInvalid: [];
  clearInvalid: [];
}>();

// Progress bar width
const progressWidth = (completed: number, total: number) => {
  if (total === 0) return "0%";
  return `${(completed / total) * 100}%`;
};

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

function getStatusText(file: UploadFile): string {
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
function getSummaryText(summary: {
  succeeded: number;
  failed: number;
  cancelled: number;
}): string {
  const parts = [];
  if (summary.succeeded > 0) parts.push(`${summary.succeeded} uploaded`);
  if (summary.failed > 0) parts.push(`${summary.failed} failed`);
  if (summary.cancelled > 0) parts.push(`${summary.cancelled} cancelled`);
  return parts.join(", ");
}
</script>

<template>
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
        v-for="(invalid, index) in invalidFiles"
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
        variant="primary"
        text-size="sm"
        @click="emit('skipInvalid')"
      >
        Skip invalid & continue ({{ files.length }} valid)
      </AppButton>
      <AppButton
        variant="secondary"
        text-size="sm"
        @click="emit('clearInvalid')"
      >
        Cancel all
      </AppButton>
    </div>
  </div>

  <!-- Cancelling Banner -->
  <div
    v-if="isCancelling"
    class="mb-4 rounded-lg border border-amber-500 bg-amber-950/50 p-3 text-left text-xs text-amber-300"
  >
    <span class="font-medium">Cancelling uploads...</span>
  </div>

  <!-- Progress Section (during upload) -->
  <div v-if="isUploading">
    <!-- Progress Bar -->
    <div class="mb-4">
      <div class="mb-2 h-2 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          class="h-full bg-blue-600 transition-all duration-300"
          :style="{ width: progressWidth(progress.completed, progress.total) }"
        />
      </div>
      <p class="text-center text-[0.92rem] text-neutral-300 md:text-base">
        {{ progress.completed }} of {{ progress.total }} files
      </p>
    </div>

    <!-- File List -->
    <div
      class="mb-4 max-h-96 space-y-2 overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900 p-3"
    >
      <div
        v-for="file in files"
        :key="file.id"
        class="flex items-start gap-3 text-xs"
      >
        <div class="mt-1 shrink-0">
          <div
            :class="[
              'h-2 w-2 rounded-full',
              getStatusDotColor(file.status),
              file.status === 'uploading' ? 'animate-pulse' : '',
            ]"
          />
        </div>
        <div class="min-w-0 flex-1 text-left">
          <div class="flex items-center gap-2">
            <span class="truncate font-medium text-neutral-100">
              {{ file.fileName }}
            </span>
            <span class="shrink-0 text-[0.7rem] text-neutral-500">
              ({{ formatFileSize(file.fileSize) }})
            </span>
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
        v-if="!isCancelling"
        variant="secondary"
        text-size="sm"
        @click="emit('cancel')"
      >
        Cancel Upload
      </AppButton>
    </div>
  </div>

  <!-- Summary (after upload completes) -->
  <div v-if="summary && !isUploading" class="text-center">
    <div class="mb-4 rounded-lg border border-neutral-700 bg-neutral-800 p-4">
      <p class="mb-1 text-sm font-semibold text-neutral-100">
        Upload {{ summary.cancelled > 0 ? "cancelled" : "complete" }}
      </p>
      <p class="text-xs text-neutral-300">
        {{ getSummaryText(summary) }}
      </p>
    </div>

    <!-- Show file list if there were failures -->
    <div
      v-if="summary.failed > 0 || summary.cancelled > 0"
      class="mb-4 max-h-60 space-y-2 overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-left"
    >
      <div
        v-for="file in files"
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

    <AppButton variant="secondary" text-size="sm" @click="emit('close')">
      Close
    </AppButton>
  </div>
</template>
