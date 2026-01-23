<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="toggleDropdown"
      class="flex items-center gap-2 rounded border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 transition-colors hover:bg-neutral-800"
    >
      Select by filter
      <Icon
        name="chevron"
        :size="16"
        class="transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute left-0 z-50 mt-1 w-64 rounded-lg border border-neutral-700 bg-neutral-800 py-1 shadow-lg"
      >
        <!-- Filter options with checkboxes -->
        <label
          v-for="filter in availableFilters"
          :key="filter.id"
          class="flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-neutral-700"
        >
          <input
            type="checkbox"
            v-model="selectedFilters"
            :value="filter.id"
            class="h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-neutral-100 focus:ring-2 focus:ring-neutral-500"
          />
          <span class="text-sm text-neutral-100">{{ filter.label }}</span>
        </label>

        <div class="border-t border-neutral-700 px-3 py-2">
          <button
            @click="applyFilters"
            :disabled="selectedFilters.length === 0"
            class="w-full rounded bg-neutral-100 px-3 py-1.5 text-sm text-neutral-900 transition-colors hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";

const emit = defineEmits<{
  select: [filterIds: string[]];
}>();

interface Filter {
  id: string;
  label: string;
}

const availableFilters: Filter[] = [
  { id: "in-layout", label: "In layouts" },
  { id: "not-in-layout", label: "Not in layouts" },
  { id: "public", label: "Public" },
  { id: "private", label: "Private" },
  { id: "primary", label: "Primary image" },
];

const isOpen = ref(false);
const selectedFilters = ref<string[]>([]);
const dropdownRef = ref<HTMLElement | null>(null);

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function applyFilters() {
  emit("select", selectedFilters.value);
  isOpen.value = false;
  selectedFilters.value = [];
}

onClickOutside(dropdownRef, () => {
  isOpen.value = false;
});
</script>
