<script setup lang="ts">
const props = defineProps<{
  image: any;
}>();

const emit = defineEmits<{
  click: [image: any];
}>();
</script>

<template>
  <div
    @click="emit('click', image)"
    class="group mt-auto mb-auto cursor-pointer bg-gray-100"
  >
    <NuxtPicture
      :src="image.r2_path"
      :alt="image.alt ?? 'Journal Image'"
      :img-attrs="{ class: 'w-full h-auto object-cover' }"
    />
  </div>
</template>
