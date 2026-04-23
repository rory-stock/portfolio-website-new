<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    maxWidth?: "sm" | "md" | "lg" | "xl";
    closeOnBackdrop?: boolean;
  }>(),
  {
    maxWidth: "md",
    closeOnBackdrop: true,
  }
);

const emit = defineEmits<{
  close: [];
}>();

const widthClasses: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

function handleBackdropClick(e: MouseEvent) {
  if (props.closeOnBackdrop && e.target === e.currentTarget) {
    emit("close");
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && props.open) {
    emit("close");
  }
}

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});

// Prevent body scroll when open
watch(
  () => props.open,
  (isOpen) => {
    document.body.style.overflow = isOpen ? "hidden" : "";
  }
);

onUnmounted(() => {
  document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-30 md:z-50 flex items-center justify-center bg-black/70 p-4"
        @click="handleBackdropClick"
      >
        <div
          class="w-full overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950"
          :class="widthClasses[maxWidth]"
        >
          <!-- Header (optional) -->
          <div
            v-if="title || $slots.header"
            class="flex items-center justify-between border-b border-neutral-800 px-5 py-3"
          >
            <slot name="header">
              <h3 class="text-sm font-medium text-neutral-100">
                {{ title }}
              </h3>
            </slot>
            <button
              class="text-neutral-500 cursor-pointer hover:text-neutral-300"
              @click="emit('close')"
            >
              <Icon name="cross" :size="18" />
            </button>
          </div>

          <!-- Body -->
          <div>
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
