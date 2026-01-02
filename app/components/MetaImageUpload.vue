<template>
  <div>
    <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between">
      <h3 class="text-lg font-semibold text-neutral-200 capitalize">
        {{ context }} Page
      </h3>
      <p class="block text-neutral-400">
        {{ label }}
      </p>
    </div>

    <!-- Current Image Preview or Skeleton -->
    <div
      v-if="imageExists"
      class="relative w-fit overflow-hidden rounded border border-neutral-700"
    >
      <NuxtPicture
        :src="imagePath"
        :alt="`${context} meta image preview`"
        format="webp"
        :img-attrs="{ class: 'max-w-full' }"
        @load="imageExists = true"
        @error="handleImageError"
      />
      <AppButton
        variant="danger"
        @click="handleDelete"
        :disabled="deleting || !imageExists"
        :loading="deleting"
        class="absolute top-2 right-2 z-50 hover:text-neutral-300"
      >
        <template #loading>Deleting...</template>
        <Icon name="bin" :size="20" />
      </AppButton>
    </div>

    <!-- Skeleton when no image -->
    <div
      v-else
      class="flex max-w-full items-center justify-center rounded border border-neutral-700 bg-neutral-800"
      :style="{
        aspectRatio: `${metaImageConstraints.width} / ${metaImageConstraints.height}`,
      }"
    >
      <p class="text-sm text-neutral-400">No image uploaded</p>
    </div>

    <!-- Upload Input (hidden) -->
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- Action Buttons -->
    <div class="mt-2 flex max-w-full flex-col gap-2 lg:flex-row">
      <AppButton
        @click="triggerFileInput"
        :disabled="uploading"
        :loading="uploading"
        class="w-full"
      >
        <template #loading>Uploading...</template>
        {{ imageExists ? "Replace Image" : "Upload Image" }}
      </AppButton>

      <AppButton
        variant="secondary"
        @click="handlePurgeCache"
        :disabled="purging || !imageExists"
        :loading="purging"
        class="w-full"
      >
        <template #loading>Purging...</template>
        Clear Cache
      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getMetaImagePath } from "~/utils/meta";
import { metaImageConstraints, VALID_IMAGE_TYPES } from "~/utils/constants";

interface Props {
  context: string;
  label: string;
}

const props = defineProps<Props>();
const { success, error: showError } = useToast();

const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const purging = ref(false);
const deleting = ref(false);
const imageExists = ref(true); // Assume exists, will show an error if not
const imageKey = ref(0); // Force re-render on upload

const imagePath = computed(() => {
  return `${getMetaImagePath(props.context)}?v=${imageKey.value}`;
});

function triggerFileInput() {
  fileInput.value?.click();
}

function handleImageError() {
  imageExists.value = false;
}

async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  // Validate a file type
  if (!VALID_IMAGE_TYPES.includes(file.type as any)) {
    showError("Invalid file type. Only JPEG and WebP allowed");
    input.value = "";
    return;
  }

  // Validate dimensions - must be exactly 1200×675
  const dimensions = await validateImageDimensions(file);

  if (
    dimensions.width !== metaImageConstraints.width ||
    dimensions.height !== metaImageConstraints.height
  ) {
    showError(
      `Invalid dimensions. Must be exactly ${metaImageConstraints.width}×${metaImageConstraints.height}px, got ${dimensions.width}×${dimensions.height}px`
    );
    input.value = "";
    return;
  }

  // Upload
  uploading.value = true;

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("context", props.context);

    await $fetch("/api/meta/upload", {
      method: "POST",
      body: formData,
    });

    success("Image uploaded successfully");
    imageExists.value = true;
    imageKey.value++; // Force image refresh
  } catch (e: any) {
    showError(e.data?.message || "Failed to upload image");
  } finally {
    uploading.value = false;
    input.value = "";
  }
}

async function handlePurgeCache() {
  purging.value = true;

  try {
    const result = await $fetch("/api/meta/purge-cache", {
      method: "POST",
      body: {
        context: props.context,
      },
    });

    if (result.purged) {
      success("Cache purged successfully");
      imageKey.value++; // Force image refresh
    } else {
      showError("Cloudflare credentials not configured");
    }
  } catch (e: any) {
    showError(e.data?.message || "Failed to purge cache");
  } finally {
    purging.value = false;
  }
}

async function handleDelete() {
  if (!confirm(`Are you sure you want to delete this meta image?`)) {
    return;
  }

  deleting.value = true;

  try {
    await $fetch("/api/meta/delete", {
      method: "DELETE",
      body: {
        context: props.context,
      },
    });

    success("Image deleted successfully");
    imageExists.value = false;
    imageKey.value++; // Force refresh
  } catch (e: any) {
    showError(e.data?.message || "Failed to delete image");
  } finally {
    deleting.value = false;
  }
}

function validateImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = objectUrl;
  });
}
</script>
