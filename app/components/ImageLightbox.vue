<script setup lang="ts">
import { onKeyStroke, useScrollLock } from "@vueuse/core";

const props = withDefaults(
  defineProps<{
    imagePath: string;
    alt: string;
    description: string;
    isOpen: boolean;
    showDownload?: boolean;
    imageInstanceId?: number | null;
    imageContext?: string;
  }>(),
  {
    showDownload: false,
    imageInstanceId: null,
    imageContext: "",
  }
);

const emit = defineEmits<{
  close: [];
}>();

// Lock body scroll when modal is open
const body = ref<HTMLElement | null>(null);
const isLocked = useScrollLock(body);

onMounted(() => {
  body.value = document.body;
});

watch(
  () => props.isOpen,
  (isOpen) => {
    isLocked.value = isOpen;
  }
);

// Handle escape key
onKeyStroke("Escape", () => {
  if (props.isOpen) emit("close");
});

// Track image loading state
const imageLoading = ref(true);
const handleImageLoad = () => {
  imageLoading.value = false;
};

// Reset loading state when the image changes
watch(
  () => props.imagePath,
  () => {
    imageLoading.value = true;
  }
);

// Whether download button should render
const canDownload = computed(
  () =>
    props.showDownload && props.imageInstanceId !== null && props.imageContext
);
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-white p-6"
        @click="emit('close')"
      >
        <!-- Top-right buttons -->
        <div
          class="absolute top-3 right-3 z-50 flex items-center gap-2 md:top-8 md:right-10"
        >
          <!-- Download button -->
          <DownloadButton
            v-if="canDownload"
            :instance-id="imageInstanceId!"
            :context="imageContext!"
            class="flex h-10 w-10 cursor-pointer items-center justify-center transition-colors duration-200 hover:text-neutral-600"
          >
            <Icon name="download" :size="34" class="mt-1" />
          </DownloadButton>

          <!-- Close button -->
          <AppButton
            @click="emit('close')"
            variant="secondary-simple"
            class="px-0 py-0 text-black hover:text-neutral-600 md:px-0"
            aria-label="Close"
          >
            <Icon name="cross" :size="34" />
          </AppButton>
        </div>

        <!-- Loading spinner -->
        <div
          v-if="imageLoading"
          class="absolute inset-0 flex items-center justify-center"
        >
          <div
            class="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900"
          />
        </div>

        <div class="flex flex-col items-center gap-2">
          <NuxtPicture
            :src="imagePath"
            :alt="alt"
            :imgAttrs="{
              class:
                'max-h-[75vh] select-none max-w-[94vw] w-auto h-auto object-contain',
            }"
            @click.stop
            @load="handleImageLoad"
          />
          <p
            v-if="description"
            class="font-neue-montreal-medium-semi text-2xl selection:bg-black selection:text-white"
            @click.stop
          >
            {{ description }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
