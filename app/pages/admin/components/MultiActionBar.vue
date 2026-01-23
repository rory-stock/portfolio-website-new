<template>
  <Transition name="slide">
    <div
      v-if="selectedCount > 0"
      class="fixed right-0 bottom-2 lg:bottom-6 left-0 z-30 mx-2 rounded-2xl border border-neutral-700 bg-neutral-900 p-3 md:p-4 lg:mx-auto lg:w-1/3"
    >
      <div class="flex items-center justify-between">
        <!-- Selection info -->
        <div class="flex items-center gap-4">
          <span class="text-xs text-neutral-300 md:text-sm">
            {{ selectedCount }} selected
          </span>
          <AppButton
            @click="emit('clearSelection')"
          >
            Clear
          </AppButton>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <AppButton
            v-for="action in availableActions"
            :key="action.id"
            :variant="action.variant"
            @click="handleAction(action)"
            class="flex flex-row items-center px-2 py-1 text-xs md:px-4 md:py-2 md:text-sm"
          >
            <Icon :name="action.icon" :size="14" class="md:mr-1" />
            <span class="hidden md:inline">{{ action.label }}</span>
          </AppButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { MultiAction } from "~~/types/multiActions";
import type { DisplayImage } from "~~/types/imageTypes";

const props = defineProps<{
  selectedCount: number;
  selectedImages: DisplayImage[];
  actions: MultiAction[];
}>();

const emit = defineEmits<{
  action: [action: MultiAction];
  clearSelection: [];
}>();

// All actions are available (no filtering needed)
const availableActions = computed(() => props.actions);

function handleAction(action: MultiAction) {
  emit("action", action);
}
</script>
