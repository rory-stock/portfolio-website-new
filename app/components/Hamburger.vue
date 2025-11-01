<script setup lang="ts">
defineProps({
  isOpen: Boolean,
});
</script>

<template>
  <div class="flex w-13 cursor-pointer flex-col content-center gap-1">
    <div
      class="block h-1 w-full transform bg-black transition duration-300 ease-in-out"
      :class="isOpen && 'translate-y-1 scale-x-80 rotate-45'"
    ></div>
    <div
      class="block h-1 w-full transform bg-black transition duration-300 ease-in-out"
      :class="isOpen && '-translate-y-1 scale-x-80 -rotate-45'"
    ></div>
  </div>
</template>
