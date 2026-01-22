<template>
  <Transition name="slide-up">
    <div
      v-if="selectedCount > 0"
      class="fixed right-0 bottom-0 left-0 z-50 border-t border-neutral-700 bg-neutral-900 p-3 md:p-4"
    >
      <div class="flex items-center justify-between">
        <!-- Selection info -->
        <div class="flex items-center gap-4">
          <span class="text-xs text-neutral-300 md:text-sm">
            {{ selectedCount }} selected
          </span>
          <button
            @click="emit('clearSelection')"
            class="text-xs text-neutral-400 transition-colors hover:text-neutral-200 md:text-sm"
          >
            Clear
          </button>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <AppButton
            v-for="action in availableActions"
            :key="action.id"
            :variant="action.variant"
            @click="handleAction(action)"
            class="px-2 py-1 text-xs md:px-4 md:py-2 md:text-sm"
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

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
