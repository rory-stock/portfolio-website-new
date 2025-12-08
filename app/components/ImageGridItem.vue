<script setup lang="ts">
const props = defineProps<{
  image: any;
}>();

const emit = defineEmits<{
  click: [image: any];
}>();
</script>

<template>
  <button
    type="button"
    @click="emit('click', image)"
    class="group my-auto w-full bg-gray-100"
    aria-label="View Image"
  >
    <NuxtPicture
      :src="image.r2_path"
      :alt="image.alt ?? ''"
      :img-attrs="{ class: 'w-full h-auto object-cover' }"
    />
  </button>
</template>
