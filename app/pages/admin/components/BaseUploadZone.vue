<script setup lang="ts">
import { useDropZone } from "@vueuse/core";
import { useFileUpload } from "~/composables/useFileUpload";

const props = withDefaults(
  defineProps<{
    context: string;
    onAfterUpload?: (imageIds: number[]) => Promise<void>;
  }>(),
  {
    onAfterUpload: undefined,
  }
);

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
  onComplete: async (imageIds: number[]) => {
    if (props.onAfterUpload) {
      await props.onAfterUpload(imageIds);
    }
    clearCompleted();
    emit("uploaded");
  },
});

// Drop zone
const dropZoneRef = ref<HTMLElement | null>(null);
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

// File input
const fileInputRef = ref<HTMLInputElement | null>(null);

function openFilePicker() {
  fileInputRef.value?.click();
}

function onFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    selectFiles(Array.from(input.files));
    if (!hasInvalidFiles.value && hasValidFiles.value) {
      startUpload();
    }
  }
  input.value = "";
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

const showUploadProgress = computed(() => {
  return (
    state.isUploading ||
    state.isCancelling ||
    state.summary ||
    hasInvalidFiles.value
  );
});

// Computed classes for drop zone
const dropZoneClasses = computed(() => [
  isOverDropZone.value
    ? "border-solid border-neutral-500 bg-neutral-800/50"
    : "",
  showUploadProgress.value
    ? "cursor-default"
    : "cursor-pointer hover:border-neutral-500 hover:bg-neutral-800/50",
]);
</script>

<template>
  <div
    ref="dropZoneRef"
    class="relative rounded-lg border-2 border-dashed border-neutral-700 text-center transition-all duration-300"
    :class="dropZoneClasses"
  >
    <!-- Upload progress / invalid files / summary -->
    <UploadProgress
      v-if="showUploadProgress"
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
    <div
      v-else
      class="flex h-26 cursor-pointer flex-col justify-center"
      @click="openFilePicker"
    >
      <input
        ref="fileInputRef"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        class="hidden"
        @change="onFileInputChange"
      />

      <p class="text-sm text-neutral-400">
        Drop images here or click to upload
      </p>
      <p class="mt-1 text-xs text-neutral-600">JPG, PNG, WebP — 60MB max</p>
    </div>
  </div>
</template>
