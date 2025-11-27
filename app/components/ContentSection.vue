<template>
  <div class="rounded border border-neutral-800 bg-neutral-900 p-6">
    <h2 class="mb-3 text-xl font-bold text-neutral-100 md:mb-6 md:text-2xl">
      {{ title }}
    </h2>

    <div v-if="loading" class="text-neutral-400">Loading...</div>
    <div v-else-if="error" class="text-red-400">{{ error }}</div>

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
        <button
          type="submit"
          :disabled="!hasChanges || saving"
          class="cursor-pointer rounded bg-neutral-100 px-2 py-2 text-[0.92rem] text-neutral-980 transition-all duration-200 hover:bg-neutral-300 disabled:opacity-50 md:px-4 md:text-base"
        >
          {{ saving ? "Saving..." : "Save Changes" }}
        </button>
        <button
          type="button"
          @click="handleDiscard"
          :disabled="!hasChanges || saving"
          class="cursor-pointer rounded border border-neutral-700 px-2 py-2 text-[0.92rem] text-neutral-200 transition-all duration-200 hover:bg-neutral-800 disabled:opacity-50 md:px-4 md:text-base"
        >
          Discard Changes
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
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

const props = defineProps<Props>();
const { success, error: showError } = useToast();

const loading = ref(true);
const error = ref("");
const saving = ref(false);

const originalData = ref<Record<string, string>>({});
const formData = ref<Record<string, string>>({});

const hasChanges = computed(() => {
  return props.fields.some(
    (field) => formData.value[field.key] !== originalData.value[field.key]
  );
});

const fetchContent = async () => {
  loading.value = true;
  error.value = "";

  try {
    const response = await $fetch(`/api/content?table=${props.table}`);

    // Convert array of {key, value} to object
    const data: Record<string, string> = {};
    for (const item of response as any[]) {
      data[item.key] = item.value || "";
    }

    // Initialize form with field keys (even if not in DB yet)
    const initialized: Record<string, string> = {};
    for (const field of props.fields) {
      initialized[field.key] = data[field.key] || "";
    }

    originalData.value = { ...initialized };
    formData.value = { ...initialized };
  } catch (e: any) {
    error.value = e.message || "Failed to load content";
    showError(error.value);
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  saving.value = true;

  try {
    const updates = props.fields
      .filter(
        (field) => formData.value[field.key] !== originalData.value[field.key]
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

    originalData.value = { ...formData.value };
    success("Content saved successfully");
  } catch (e: any) {
    showError(e.message || "Failed to save content");
  } finally {
    saving.value = false;
  }
};

const handleDiscard = () => {
  formData.value = { ...originalData.value };
  success("Changes discarded");
};

onMounted(() => {
  fetchContent();
});
</script>
