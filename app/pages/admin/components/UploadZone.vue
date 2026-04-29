<script setup lang="ts">
import { useDropZone } from "@vueuse/core";
import { useFileUpload } from "~/composables/useFileUpload";

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
    if (!hasInvalidFiles.value && hasValidFiles.value) {
      startUpload();
    }
  }
  input.value = "";
}

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
  <div ref="dropZoneRef" :class="dropZoneClasses">
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

    <!-- Upload Trigger (when idle) -->
    <div v-else>
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
  </div>
</template>
