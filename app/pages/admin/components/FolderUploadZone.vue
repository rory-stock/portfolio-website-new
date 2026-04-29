<script setup lang="ts">
import { useDropZone } from "@vueuse/core";
import UploadProgress from "~/pages/admin/components/UploadProgress.vue";

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

function handleSkipInvalid() {
  void skipInvalidAndUpload();
}

function handleClearInvalid() {
  clearInvalidFiles();
  reset();
}

function handleClose() {
  reset();
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

    <!-- Upload progress / invalid files / summary -->
    <UploadProgress
      v-if="hasInvalidFiles || state.isUploading || state.summary"
      :files="state.files"
      :invalid-files="state.invalidFiles"
      :has-invalid-files="hasInvalidFiles"
      :has-valid-files="hasValidFiles"
      :is-uploading="state.isUploading"
      :is-cancelling="state.isCancelling"
      :progress="state.progress"
      :summary="state.summary"
      @cancel="cancelUpload"
      @close="handleClose"
      @skip-invalid="handleSkipInvalid"
      @clear-invalid="handleClearInvalid"
    />

    <!-- Drop zone (shown when idle) -->
    <div
      v-else
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
  </div>
</template>
