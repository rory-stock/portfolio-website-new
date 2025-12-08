<template>
  <div class="md:hidden">
    <button
      type="button"
      @click="toggle()"
      class="pr-3 pb-3"
      aria-label="Toggle mobile menu"
    >
      <Hamburger :isOpen="isOpen" />
    </button>
    <MobileMenu :isOpen="isOpen" />
  </div>
</template>

<script setup lang="ts">
import { useScrollLock, syncRefs, useToggle } from "@vueuse/core";

const route = useRoute();

const [isOpen, toggle] = useToggle(false);

watch(
  () => route.path,
  () => {
    isOpen.value = false;
  }
);

const isLocked = useScrollLock(() => document?.body);
syncRefs(isOpen, isLocked);
</script>
