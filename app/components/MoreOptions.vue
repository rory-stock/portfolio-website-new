<script setup lang="ts">
import { onClickOutside, onKeyStroke } from "@vueuse/core";

const props = defineProps<{
  iconSize?: number;
  class?: string;
}>();

const isOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);

function toggle() {
  isOpen.value = !isOpen.value;
}

function close() {
  isOpen.value = false;
}

onClickOutside(menuRef, () => {
  if (isOpen.value) close();
});

onKeyStroke("Escape", (e) => {
  if (isOpen.value) {
    e.preventDefault();
    close();
  }
});
</script>

<template>
  <div ref="menuRef" class="relative" :class="props.class">
    <!-- Trigger -->
    <AppButton
      variant="secondary-simple"
      class="px-0 py-0 md:px-0"
      title="More options"
      aria-label="More options"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      @click.stop.prevent="toggle"
    >
      <Icon name="moreOptions" :size="iconSize" />
    </AppButton>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute right-0 z-50 mt-1 min-w-40 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        role="menu"
        @click="close"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>
