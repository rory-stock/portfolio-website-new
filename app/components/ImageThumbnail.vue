<template>
  <div
    class="group relative cursor-pointer overflow-hidden rounded border border-neutral-700 bg-neutral-800"
    :class="{ 'ring-2 ring-blue-500': image.is_primary }"
    @click="$emit('click')"
  >
    <img
      :src="image.url"
      :alt="image.alt || 'Image'"
      class="h-48 w-full object-cover"
      loading="lazy"
    />

    <!-- Primary indicator (clickable, shows on hover) -->
    <button
      class="absolute top-2 right-2 rounded p-1.5 shadow-lg transition-opacity"
      :class="
        image.is_primary
          ? 'bg-blue-600 text-white opacity-100 hover:bg-blue-700'
          : 'bg-neutral-900/80 text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-blue-500'
      "
      :title="image.is_primary ? 'Remove as primary' : 'Set as primary'"
      @click.stop="$emit('togglePrimary')"
    >
      ★
    </button>

    <!-- Privacy indicator -->
    <div
      v-if="!image.is_public"
      class="absolute top-2 left-2 rounded bg-neutral-900 px-2 py-1 text-xs font-medium text-neutral-300 shadow-lg"
    >
      Private
    </div>

    <!-- Drag handle indicator -->
    <div
      class="absolute right-2 bottom-2 rounded bg-neutral-900/80 p-1 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100"
      title="Drag to reorder"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 8h16M4 16h16"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Image {
  id: number;
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
