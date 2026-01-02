<template>
  <div class="space-y-4">
    <!-- Public Visibility Toggle -->
    <div class="flex items-center justify-between">
      <div>
        <label for="is_public" class="font-medium text-neutral-100">
          Public Visibility
        </label>
        <p class="text-sm text-neutral-400">
          Allow viewing without authentication
        </p>
      </div>
      <button
        id="is_public"
        type="button"
        role="switch"
        :aria-checked="isPublic"
        @click="emit('update:isPublic', !isPublic)"
        @keydown.space.prevent="emit('update:isPublic', !isPublic)"
        @keydown.enter.prevent="emit('update:isPublic', !isPublic)"
        class="relative inline-flex h-6 w-12 cursor-pointer items-center rounded-full transition-colors focus:outline-0"
        :class="isPublic ? 'bg-neutral-100' : 'bg-neutral-700'"
      >
        <span
          class="inline-block h-5 w-5 transform rounded-full bg-neutral-980 transition-transform"
          :class="isPublic ? 'translate-x-6' : 'translate-x-1'"
        />
      </button>
    </div>

    <!-- Context Selection Dropdown -->
    <div class="relative mb-4">
      <label class="mb-1 block font-medium text-neutral-100"> Contexts </label>

      <div v-if="isLoading" class="text-sm text-neutral-500">Loading...</div>

      <div v-else ref="dropdownRef" class="relative">
        <!-- Dropdown trigger -->
        <button
          type="button"
          @click="toggleDropdown"
          class="flex w-full items-center justify-between rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 transition-colors duration-200 hover:bg-neutral-700 focus:outline-0"
          :aria-expanded="isOpen"
          aria-haspopup="listbox"
        >
          <span>Select Contexts</span>
          <Icon
            name="chevron"
            width="21"
            height="21"
            class="transition-transform duration-200"
            :class="{ 'rotate-180': isOpen }"
            aria-hidden="true"
          />
        </button>

        <!-- Dropdown menu -->
        <Transition name="dropdown">
          <div
            v-if="isOpen"
            class="absolute z-50 mt-1 mb-4 w-full rounded-lg border border-neutral-700 bg-neutral-800 py-1"
            role="listbox"
            aria-label="Context options"
          >
            <label
              v-for="ctx in availableContexts"
              :key="ctx"
              class="mx-2 flex cursor-pointer items-center rounded-lg px-3 py-2 hover:bg-neutral-700"
              role="option"
              :aria-selected="selectedContexts.includes(ctx)"
            >
              <span
                class="relative mr-3 flex h-5 w-5 shrink-0 items-center justify-center"
              >
                <input
                  type="checkbox"
                  :value="ctx"
                  :checked="selectedContexts.includes(ctx)"
                  @change="toggleContext(ctx)"
                  :disabled="
                    selectedContexts.length === 1 &&
                    selectedContexts.includes(ctx)
                  "
                  class="peer absolute h-5 w-5 cursor-pointer appearance-none rounded border-2 border-neutral-600 bg-neutral-800 transition-all duration-200 checked:border-neutral-100 checked:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Icon
                  name="check"
                  :size="20"
                  stroke="black"
                  :strokeWidth="1"
                  class="pointer-events-none absolute text-neutral-900 opacity-0 transition-opacity duration-200 peer-checked:opacity-100"
                />
              </span>
              <span class="text-sm text-neutral-100 capitalize">{{ ctx }}</span>
            </label>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";

interface Props {
  isPublic: boolean;
  selectedContexts: string[];
  availableContexts: string[];
  isLoading: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:isPublic": [value: boolean];
  "update:selectedContexts": [value: string[]];
}>();

const isOpen = ref(false);
const dropdownRef = ref(null);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const toggleContext = (context: string) => {
  const newContexts = [...props.selectedContexts];
  const index = newContexts.indexOf(context);

  if (index > -1) {
    // Don't allow removing the last context
    if (newContexts.length === 1) return;
    newContexts.splice(index, 1);
  } else {
    newContexts.push(context);
  }

  emit("update:selectedContexts", newContexts);
};

// Close dropdown when clicking outside
onClickOutside(dropdownRef, () => {
  isOpen.value = false;
});
</script>
