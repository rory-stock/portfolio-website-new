<template>
  <div
    ref="cardRef"
    class="group relative w-full cursor-pointer overflow-hidden rounded border border-neutral-700 bg-neutral-800 transition-shadow duration-200 focus-within:ring-2 focus-within:ring-neutral-500"
    :class="{ 'ring-2 ring-neutral-300': image.is_primary }"
    role="button"
    tabindex="0"
    :aria-label="`View image: ${image.alt || 'Untitled'}`"
    @click="$emit('click')"
    @keydown.enter.prevent="$emit('click')"
    @keydown.space.prevent="$emit('click')"
  >
    <NuxtPicture
      :src="image.r2_path"
      :alt="image.alt || 'Image'"
      class="h-full w-full object-cover transition-all duration-300"
      :class="{ 'blur-sm': !imageLoaded }"
      format="webp"
      :loading="image.is_primary ? 'eager' : 'lazy'"
      densities="x1 x2"
      sizes="xs:100vw sm:50vw md:33vw lg:25vw"
      @load="imageLoaded = true"
    />

    <!-- Primary indicator (clickable, shows on hover) -->
    <button
      class="absolute top-2 right-2 cursor-pointer rounded p-1.5 shadow-lg transition-all duration-200 focus:ring-2 focus:ring-neutral-100 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:outline-none"
      :class="primaryButtonClass"
      :aria-label="
        image.is_primary ? 'Remove as primary image' : 'Set as primary image'
      "
      :aria-pressed="image.is_primary"
      @click.stop="$emit('togglePrimary')"
    >
      <Icon name="star" :size="16" class="md:h-5 md:w-5" :aria-hidden="true" />
    </button>

    <!-- Privacy indicator -->
    <div
      v-if="!image.is_public"
      class="absolute top-2 left-2 rounded bg-neutral-900 px-2 py-1 text-xs font-medium text-neutral-300 shadow-lg"
      role="status"
      aria-label="This image is private"
    >
      Private
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DisplayImage } from "~~/types/imageTypes";

interface Props {
  image: DisplayImage;
}

const props = defineProps<Props>();
defineEmits<{
  click: [];
  togglePrimary: [];
}>();

const imageLoaded = ref(false);

// Computed class for primary button
const primaryButtonClass = computed(() => {
  if (props.image.is_primary) {
    return "bg-neutral-900 text-neutral-100 opacity-100 hover:opacity-80";
  }
  return "bg-neutral-900/80 text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-neutral-100 focus:opacity-100";
});
</script>
