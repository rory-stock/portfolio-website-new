<script setup lang="ts">
const props = defineProps<{
  imagePath: string;
  alt: string;
  description: string;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

// Handle escape key and body scroll
watch(
  () => props.isOpen,
  (isOpen) => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") emit("close");
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => window.removeEventListener("keydown", handleEscape);
  }
);

// Cleanup on unmount
onBeforeUnmount(() => {
  document.body.style.overflow = "";
});
</script>

<template>
  <ClientOnly>
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
            @click="emit('close')"
            class="absolute top-6 right-6 z-50 flex h-10 w-10 cursor-pointer items-center justify-center"
            aria-label="Close"
          >
            <Icon name="cross" width="32" height="32" />
          </button>

          <div class="flex flex-col items-center gap-2">
            <NuxtPicture
              :src="imagePath"
              :alt="alt"
              :img-attrs="{
                class: 'max-h-[75vh] max-w-[75vw] w-auto h-auto object-contain',
              }"
              @click.stop
            />
            <p
              v-if="description"
              class="font-neue-montreal-medium-semi text-2xl"
            >
              {{ description }}
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
