<script setup lang="ts">
import { onKeyStroke, onClickOutside } from "@vueuse/core";
import { useTemplateRef } from "vue";

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

const target = useTemplateRef("target");
onClickOutside(target, () => {
  if (props.open && props.closeOnBackdrop) {
    emit("close");
  }
});

onKeyStroke("Escape", (e) => {
  if (props.open) {
    e.preventDefault();
    emit("close");
  }
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
        class="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4 md:z-50"
      >
        <div
          class="w-full overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950"
          :class="widthClasses[maxWidth ?? 'md']"
          ref="target"
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
              class="cursor-pointer text-neutral-500 hover:text-neutral-300"
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
