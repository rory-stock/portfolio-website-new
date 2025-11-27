<template>
  <div
    class="group relative w-full cursor-pointer overflow-hidden rounded border border-neutral-700 bg-neutral-800"
    :class="{ 'ring-2 ring-neutral-300': image.is_primary }"
    @click="$emit('click')"
  >
    <NuxtPicture
      :src="`${image.r2_path}`"
      :alt="image.alt || 'Image'"
      class="h-1/12 w-full object-cover"
      format="webp"
      loading="lazy"
    />

    <!-- Primary indicator (clickable, shows on hover) -->
    <button
      class="absolute top-2 right-2 cursor-pointer rounded p-1.5 shadow-lg transition-all duration-200"
      :class="
        image.is_primary
          ? 'bg-neutral-900 text-neutral-100 opacity-100 hover:opacity-80'
          : 'bg-neutral-900/80 text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-neutral-100'
      "
      :title="image.is_primary ? 'Remove as primary' : 'Set as primary'"
      @click.stop="$emit('togglePrimary')"
    >
      <Icon name="star" width="18" height="18" />
    </button>

    <!-- Privacy indicator -->
    <div
      v-if="!image.is_public"
      class="absolute top-2 left-2 rounded bg-neutral-900 px-2 py-1 text-xs font-medium text-neutral-300 shadow-lg"
    >
      Private
    </div>
  </div>
</template>

<script setup lang="ts">
interface Image {
  id: number;
  r2_path: string;
  url: string;
  alt: string;
  is_primary: boolean;
  is_public: boolean;
}

interface Props {
  image: Image;
}

defineProps<Props>();
defineEmits<{
  click: [];
  togglePrimary: [];
}>();
</script>
