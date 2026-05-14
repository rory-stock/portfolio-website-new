<script setup lang="ts">
import { useTimeoutFn } from "@vueuse/core";

const props = withDefaults(
  defineProps<{
    text: string;
    position?: "top" | "bottom";
    delay?: number;
  }>(),
  {
    position: "bottom",
    delay: 100,
  }
);

const isVisible = ref(false);

const { start, stop } = useTimeoutFn(
  () => {
    isVisible.value = false;
  },
  props.delay,
  { immediate: false }
);

function show() {
  stop();
  isVisible.value = true;
}

function hide() {
  start();
}
</script>

<template>
  <div class="relative inline-flex" @mouseenter="show" @mouseleave="hide">
    <slot />

    <Transition name="fade">
      <div
        v-if="isVisible"
        class="pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 rounded bg-neutral-900 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white shadow-lg"
        :class="position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'"
        role="tooltip"
      >
        {{ text }}

        <!-- Arrow -->
        <div
          class="absolute left-1/2 -translate-x-1/2 border-4 border-transparent"
          :class="
            position === 'top'
              ? 'top-full border-t-neutral-900'
              : 'bottom-full border-b-neutral-900'
          "
        />
      </div>
    </Transition>
  </div>
</template>
