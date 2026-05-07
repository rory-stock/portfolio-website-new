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
  <div class="flex flex-col items-center gap-2 md:flex-row">
    <template v-if="!isSelectionMode">
      <AppButton
        variant="secondary"
        text-size="sm"
        class="w-full py-1"
        @click="emit('enter-selection')"
      >
        Select
      </AppButton>
    </template>
    <template v-else>
      <AppButton
        variant="secondary"
        text-size="sm"
        class="w-full py-1 md:w-auto"
        @click="emit('select-all')"
      >
        Select All
      </AppButton>
      <AppButton
        variant="secondary"
        text-size="sm"
        class="w-full py-1 md:w-auto"
        @click="emit('exit-selection')"
      >
        Exit Selection
      </AppButton>
      <MultiFilterDropdown
        v-if="showFilter"
        @select="emit('filter-select', $event)"
      />
    </template>
  </div>
</template>
