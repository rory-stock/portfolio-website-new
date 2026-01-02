<template>
  <div class="rounded border border-neutral-800 bg-neutral-900 p-6">
    <h2 class="mb-3 text-xl font-bold text-neutral-100 md:mb-6 md:text-2xl">
      {{ title }} Content
    </h2>

    <div v-if="isLoading" class="text-neutral-400">Loading...</div>
    <div v-else-if="fetchError" class="text-red-400" role="alert">
      {{ fetchError }}
    </div>

    <form v-else @submit.prevent="handleSave" class="space-y-4">
      <div v-for="field in fields" :key="field.key" class="space-y-1">
        <label
          :for="field.key"
          class="block text-[0.92rem] font-medium text-neutral-200 md:text-base"
        >
          {{ field.label }}
        </label>

        <textarea
          v-if="field.type === 'textarea'"
          :id="field.key"
          v-model="formData[field.key]"
          :rows="field.rows || 5"
          class="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-2 text-[0.92rem] text-neutral-100 transition-colors duration-200 hover:bg-neutral-700 focus:bg-neutral-700 focus:outline-0 md:px-3 md:text-base"
        />

        <input
          v-else
          :id="field.key"
          :type="field.type || 'text'"
          v-model="formData[field.key]"
          class="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-2 text-[0.92rem] text-neutral-100 transition-colors duration-200 hover:bg-neutral-700 focus:bg-neutral-700 focus:outline-0 md:px-3 md:text-base"
        />
      </div>

      <div
        class="flex flex-col gap-2 border-t border-neutral-800 pt-4 md:flex-row md:gap-3"
      >
        <AppButton
          type="submit"
          :disabled="!hasChanges || saving"
          :loading="saving"
        >
          <template #loading>Saving...</template>
          Save Changes
        </AppButton>
        <AppButton
          variant="secondary"
          type="button"
          @click="handleDiscard"
          :disabled="!hasChanges || saving"
        >
          Discard Changes
        </AppButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useAsyncState, useCloned, onKeyStroke } from "@vueuse/core";

interface Field {
  key: string;
  label: string;
  type?: "text" | "textarea" | "email" | "url";
  rows?: number;
}

interface Props {
  table: string;
  fields: Field[];
  title: string;
}

interface ContentItem {
  key: string;
  value: string;
}

type FormData = Record<string, string>;

const props = defineProps<Props>();
const { success, error: showError } = useToast();

const saving = ref(false);

const {
  state: contentData,
  isLoading,
  error: fetchError,
  execute: fetchContent,
} = useAsyncState(
  async () => {
    const response = await $fetch<ContentItem[]>(
      `/api/content?table=${props.table}`
    );

    // Convert the array of {key, value} to an object
    const data: FormData = {};
    for (const item of response) {
      data[item.key] = item.value || "";
    }

    // Initialize the form with field keys (even if not in DB yet)
    const initialized: FormData = {};
    for (const field of props.fields) {
      initialized[field.key] = data[field.key] || "";
    }

    return initialized;
  },
  {} as FormData,
  {
    immediate: true,
    onError: (e) => {
      const message = e instanceof Error ? e.message : "Failed to load content";
      showError(message);
    },
  }
);

const { cloned: formData, sync } = useCloned(contentData);

// Check if the form has changes
const hasChanges = computed(() => {
  return props.fields.some(
    (field) => formData.value[field.key] !== contentData.value[field.key]
  );
});

const handleSave = async () => {
  saving.value = true;

  try {
    const updates = props.fields
      .filter(
        (field) => formData.value[field.key] !== contentData.value[field.key]
      )
      .map((field) => ({
        key: field.key,
        value: formData.value[field.key],
      }));

    if (updates.length === 0) {
      success("No changes to save");
      return;
    }

    await $fetch("/api/content", {
      method: "PATCH",
      body: {
        table: props.table,
        updates,
      },
    });

    // Refetch from the server to get the latest state
    await fetchContent();
    sync();

    success("Content saved successfully");
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save content";
    showError(message);
  } finally {
    saving.value = false;
  }
};

const handleDiscard = () => {
  sync(); // Reset to original
  success("Changes discarded");
};

// Keyboard shortcut: Ctrl/Cmd + S to save
onKeyStroke(
  "s",
  (e) => {
    if ((e.ctrlKey || e.metaKey) && hasChanges.value && !saving.value) {
      e.preventDefault();
      handleSave();
    }
  },
  { dedupe: true }
);

// Revert changes on Ctrl/Cmd + Z
onKeyStroke("z", (e) => {
  if ((e.ctrlKey || e.metaKey) && hasChanges.value && !saving.value) {
    e.preventDefault();
    handleDiscard();
  }
});
</script>
