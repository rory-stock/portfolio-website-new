<script setup lang="ts">
import { onKeyStroke, useScrollLock } from "@vueuse/core";

const props = defineProps<{
  imagePath: string;
  alt: string;
  description: string;
  isOpen: boolean;
}>();

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
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-white p-6"
        @click="emit('close')"
      >
        <button
          type="button"
          @click="emit('close')"
          class="absolute top-3 right-3 z-50 flex h-10 w-10 cursor-pointer items-center justify-center md:top-8 md:right-10"
          aria-label="Close"
        >
          <Icon name="cross" :size="32" />
        </button>

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
            :img-attrs="{
              class: 'max-h-[75vh] max-w-[94vw] w-auto h-auto object-contain',
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
