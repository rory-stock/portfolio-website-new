<script setup lang="ts">
import { useDropZone } from "@vueuse/core";

const props = defineProps<{
  folderId: number;
  folderType: "event" | "client_gallery" | "project";
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
  reset,
} = useFileUpload({
  context: "events",
  onComplete: async (imageIds: number[]) => {
    // After upload, link each new image instance to this folder
    for (const instanceId of imageIds) {
      try {
        await $fetch(`/api/folders/${props.folderId}/images`, {
          method: "POST",
          body: { image_instance_id: instanceId },
        });
      } catch (error) {
        console.error(`Failed to link image ${instanceId} to folder:`, error);
      }
    }
    emit("uploaded");
  },
});

// Drop zone
const dropZoneRef = ref<HTMLElement | null>(null);
const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop: (files) => {
    if (files && files.length > 0) {
      selectFiles(Array.from(files));
    }
  },
});

// File input
const fileInput = ref<HTMLInputElement | null>(null);

function openFilePicker() {
  fileInput.value?.click();
}

function onFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    selectFiles(Array.from(input.files));
    input.value = "";
  }
}

// Auto-start upload when files are selected and all valid
watch(
  () => state.files.length,
  () => {
    if (canUpload.value && !hasInvalidFiles.value) {
      void startUpload();
    }
  }
);

function getStatusIcon(status: string): string {
  switch (status) {
    case "success":
      return "✓";
    case "error":
      return "✗";
    case "uploading":
      return "⟳";
    case "cancelled":
      return "—";
    default:
      return "⏳";
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "success":
      return "text-green-500";
    case "error":
      return "text-red-500";
    case "uploading":
      return "text-blue-500 animate-spin";
    case "cancelled":
      return "text-neutral-500";
    default:
      return "text-neutral-600";
  }
}
</script>

<template>
  <div>
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/jpeg,image/png,image/webp"
      class="hidden"
      @change="onFileInputChange"
    />

    <!-- Invalid files alert -->
    <div
      v-if="hasInvalidFiles"
      class="rounded-lg border border-red-800 bg-red-950/50 p-4"
    >
      <p class="mb-2 text-xs font-medium text-red-300">
        {{ state.invalidFiles.length }} file{{
          state.invalidFiles.length > 1 ? "s" : ""
        }}
        can't be uploaded:
      </p>
      <div class="mb-3 max-h-32 space-y-1 overflow-y-auto">
        <div
          v-for="(invalid, i) in state.invalidFiles"
          :key="i"
          class="text-xs text-red-400"
        >
          <span class="font-medium">{{ invalid.file.name }}</span>
          — {{ invalid.reasons.join(", ") }}
        </div>
      </div>
      <div class="flex gap-2">
        <button
          v-if="hasValidFiles"
          class="rounded bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-950 hover:bg-white"
          @click="void skipInvalidAndUpload()"
        >
          Skip invalid &amp; upload {{ state.files.length }} file{{
            state.files.length > 1 ? "s" : ""
          }}
        </button>
        <button
          class="rounded border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200 hover:border-neutral-500"
          @click="
            clearInvalidFiles();
            reset();
          "
        >
          Cancel all
        </button>
      </div>
    </div>

    <!-- Drop zone (shown when idle) -->
    <div
      v-else-if="!state.isUploading && state.files.length === 0"
      ref="dropZoneRef"
      class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors"
      :class="
        isOverDropZone
          ? 'border-solid border-neutral-500 bg-neutral-800/50'
          : 'border-neutral-700 hover:border-neutral-500'
      "
      @click="openFilePicker"
    >
      <p class="text-sm text-neutral-400">
        Drop images here or click to upload
      </p>
      <p class="mt-1 text-xs text-neutral-600">JPG, PNG, WebP — 60MB max</p>
    </div>

    <!-- Upload progress (shown during/after upload) -->
    <div
      v-else-if="state.isUploading || state.summary"
      class="rounded-lg border border-neutral-800 bg-neutral-900 p-4"
    >
      <!-- Cancelling banner -->
      <div
        v-if="state.isCancelling"
        class="mb-3 rounded-lg border border-amber-500 bg-amber-950/50 p-2 text-xs text-amber-300"
      >
        <span class="font-medium">Cancelling uploads...</span>
      </div>

      <!-- Progress bar -->
      <div class="mb-3">
        <div class="mb-1 flex items-center justify-between text-xs">
          <span class="text-neutral-300">
            {{ state.progress.completed }} of {{ state.progress.total }} files
          </span>
          <span v-if="state.isUploading" class="text-neutral-500">
            Uploading...
          </span>
          <span v-else-if="state.summary" class="text-neutral-400">
            {{ state.summary.succeeded }} succeeded<span
              v-if="state.summary.failed > 0"
              >, {{ state.summary.failed }} failed</span
            ><span v-if="state.summary.cancelled > 0"
              >, {{ state.summary.cancelled }} cancelled</span
            >
          </span>
        </div>
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
          <div
            class="h-full rounded-full bg-blue-500 transition-all"
            :style="{
              width:
                state.progress.total > 0
                  ? `${(state.progress.completed / state.progress.total) * 100}%`
                  : '0%',
            }"
          />
        </div>
      </div>

      <!-- File list -->
      <div class="max-h-48 space-y-1 overflow-y-auto">
        <div
          v-for="file in state.files"
          :key="file.id"
          class="flex items-center gap-2 text-xs"
        >
          <!-- Status icon -->
          <span :class="getStatusColor(file.status)">
            {{ getStatusIcon(file.status) }}
          </span>

          <!-- Filename -->
          <span class="flex-1 truncate text-neutral-300">
            {{ file.fileName }}
          </span>

          <!-- Error message -->
          <span
            v-if="file.status === 'error' && 'error' in file"
            class="text-red-400"
          >
            {{ file.error }}
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-3 flex gap-2">
        <button
          v-if="state.isUploading"
          class="rounded border border-amber-600 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-950/50"
          @click="cancelUpload"
        >
          Cancel
        </button>
        <button
          v-else
          class="rounded border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200 hover:border-neutral-500"
          @click="reset"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>
