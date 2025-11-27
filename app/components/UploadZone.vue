<template>
  <div
    class="rounded-lg border-2 border-dashed border-neutral-700 p-8 text-center"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      class="hidden"
      @change="handleFileSelect"
    />

    <div v-if="!uploading">
      <p class="mb-4 text-[0.92rem] text-neutral-300 md:text-base">
        Drop images here or click to browse
      </p>
      <button
        type="button"
        @click="fileInput?.click()"
        class="cursor-pointer rounded bg-neutral-100 px-2 py-2 text-[0.92rem] text-neutral-980 transition-all duration-200 hover:bg-neutral-300 disabled:opacity-50 md:px-4 md:text-base"
      >
        Select Files
      </button>
    </div>

    <div v-else class="text-[0.92rem] text-neutral-300 md:text-base">
      <p class="mb-2">Uploading {{ currentFile }} of {{ totalFiles }}...</p>
      <div class="h-2 w-full rounded-full bg-neutral-800">
        <div
          class="h-2 rounded-full bg-blue-600 transition-all"
          :style="{ width: progress + '%' }"
        />
      </div>
    </div>

    <p v-if="errorMessage" class="mt-4 text-sm text-red-400">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  context: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  uploaded: [];
}>();

const { success, error: showError } = useToast();

const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const currentFile = ref(0);
const totalFiles = ref(0);
const errorMessage = ref("");

const progress = computed(() => {
  if (totalFiles.value === 0) return 0;
  return (currentFile.value / totalFiles.value) * 100;
});

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (!files || files.length === 0) return;

  uploading.value = true;
  errorMessage.value = "";
  totalFiles.value = files.length;
  currentFile.value = 0;

  let successCount = 0;
  let lastError = "";

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file) {
        currentFile.value = i + 1;
        try {
          await uploadFile(file);
          successCount++;
        } catch (e: any) {
          lastError = e.message || "Upload failed";
          console.error(`Failed to upload ${file.name}:`, e);
          // Continue with remaining files
        }
      }
    }

    if (successCount > 0) {
      success(
        `Successfully uploaded ${successCount} image${successCount > 1 ? "s" : ""}`
      );
      emit("uploaded");
    }

    if (lastError && successCount === 0) {
      throw new Error(lastError);
    } else if (lastError) {
      errorMessage.value = `Some uploads failed: ${lastError}`;
    }

    // Reset input
    if (fileInput.value) {
      fileInput.value.value = "";
    }
  } catch (e: any) {
    errorMessage.value = e.message || "Upload failed";
    showError(errorMessage.value);
  } finally {
    uploading.value = false;
    currentFile.value = 0;
    totalFiles.value = 0;
  }
};

const uploadFile = async (file: File) => {
  // Step 1: Get presigned URL
  const { uploadUrl, r2_path } = await $fetch("/api/images/upload-url", {
    method: "POST",
    body: {
      filename: file.name,
      context: props.context,
    },
  });

  // Step 2: Upload directly to R2 using presigned URL
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "image/jpeg",
    },
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed: ${uploadResponse.statusText}`);
  }

  // Step 3: Confirm upload and process image
  await $fetch("/api/images/confirm", {
    method: "POST",
    body: {
      r2_path,
      context: props.context,
      alt: "",
    },
  });
};
</script>
