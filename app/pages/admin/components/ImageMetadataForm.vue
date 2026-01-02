<template>
  <div class="space-y-4">
    <div v-for="field in fields" :key="field.key" class="space-y-1">
      <label :for="field.key" class="block font-medium text-neutral-100">
        {{ field.label }}
      </label>

      <textarea
        v-if="field.type === 'textarea'"
        :id="field.key"
        v-model="localFormData[field.key]"
        :rows="field.rows || 5"
        :placeholder="field.placeholder"
        class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 transition-colors duration-200 hover:bg-neutral-700 focus:bg-neutral-700 focus:outline-0"
      />

      <input
        v-else
        :id="field.key"
        :type="field.type || 'text'"
        v-model="localFormData[field.key]"
        :placeholder="field.placeholder"
        class="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 transition-colors duration-200 hover:bg-neutral-700 focus:bg-neutral-700 focus:outline-0"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ImageField } from "~~/types/imageTypes";

interface Props {
  fields: ImageField[];
  modelValue: Record<string, any>;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [value: Record<string, any>];
}>();

// Local copy with two-way binding
const localFormData = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
</script>
