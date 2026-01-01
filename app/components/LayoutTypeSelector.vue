<template>
  <div>
    <div v-if="availableLayoutTypes.length === 0" class="py-8 text-center">
      <p class="text-neutral-400">No layout types available.</p>
      <p class="mt-2 text-sm text-neutral-500">
        Images before or after this one may be in other layouts, leaving no
        consecutive images available.
      </p>
    </div>

    <div v-else class="flex flex-col gap-2 md:grid md:grid-cols-3">
      <button
        v-for="[key, layout] in availableLayoutTypes"
        :key="key"
        type="button"
        @click="emit('select', key)"
        class="flex cursor-pointer flex-col rounded border p-3 text-left transition-colors duration-300"
        :class="
          selectedLayoutType === key
            ? 'border-neutral-100 bg-neutral-800'
            : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600 hover:bg-neutral-800'
        "
      >
        <LayoutIcon :layout-type="key" class="h-8 w-full" />
        <span class="mt-2 flex flex-col space-y-0.5">
          <span class="text-sm font-medium text-neutral-100">
            {{ layout.label }}
          </span>
          <span class="text-xs text-neutral-400">
            {{ layout.description }}
          </span>
          <span class="text-xs text-neutral-500">
            {{ layout.imageCount }} image{{ layout.imageCount > 1 ? "s" : "" }}
          </span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LayoutTypeId, LayoutType } from "~/utils/layouts";

interface Props {
  availableLayoutTypes: Array<[LayoutTypeId, LayoutType]>;
  selectedLayoutType: LayoutTypeId | null;
}

defineProps<Props>();

const emit = defineEmits<{
  select: [layoutType: LayoutTypeId];
}>();
</script>
