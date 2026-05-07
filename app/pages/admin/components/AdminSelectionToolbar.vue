<script setup lang="ts">
defineProps<{
  isSelectionMode: boolean;
  showFilter?: boolean;
}>();

const emit = defineEmits<{
  "enter-selection": [];
  "exit-selection": [];
  "select-all": [];
  "filter-select": [filterIds: string[]];
}>();
</script>

<template>
  <div class="flex items-center gap-2">
    <template v-if="!isSelectionMode">
      <AppButton
        variant="secondary"
        text-size="sm"
        class="py-1"
        @click="emit('enter-selection')"
      >
        Select
      </AppButton>
    </template>
    <template v-else>
      <AppButton
        variant="secondary"
        text-size="sm"
        class="py-1"
        @click="emit('select-all')"
      >
        Select All
      </AppButton>
      <MultiFilterDropdown
        v-if="showFilter"
        @select="emit('filter-select', $event)"
      />
      <AppButton
        variant="secondary"
        text-size="sm"
        class="py-1"
        @click="emit('exit-selection')"
      >
        Exit Selection
      </AppButton>
    </template>
  </div>
</template>
