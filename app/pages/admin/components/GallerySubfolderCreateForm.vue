<script setup lang="ts">
import { onKeyStroke } from "@vueuse/core";

const props = defineProps<{
  parentFolderId: number;
}>();

const emit = defineEmits<{
  created: [];
  cancel: [];
}>();

const name = ref("");
const saving = ref(false);
const error = ref<string | null>(null);

const canSubmit = computed(() => {
  return name.value.trim().length > 0 && !saving.value;
});

async function handleSubmit() {
  if (!name.value.trim()) {
    error.value = "Name is required";
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    await $fetch("/api/folders", {
      method: "POST",
      body: {
        name: name.value.trim(),
        slug: generateSlug(name.value.trim()),
        parent_folder_id: props.parentFolderId,
        folder_type: "gallery",
        is_public: false,
      },
    });
    emit("created");
  } catch (err: any) {
    error.value = err.data?.message || "Failed to create folder";
  } finally {
    saving.value = false;
  }
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

onKeyStroke(
  "s",
  (e) => {
    if ((e.ctrlKey || e.metaKey) && canSubmit.value) {
      e.preventDefault();
      handleSubmit();
    }
  },
  { dedupe: true }
);
</script>

<template>
  <div class="space-y-4">
    <!-- Error -->
    <div
      v-if="error"
      class="rounded border border-red-800 bg-red-950/50 px-3 py-2 text-xs text-red-300"
    >
      {{ error }}
    </div>

    <!-- Name -->
    <div>
      <label class="mb-1 block text-xs text-neutral-400">Name *</label>
      <input
        v-model="name"
        type="text"
        class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none"
      />
    </div>

    <!-- Actions -->
    <div class="flex flex-col gap-2 pt-2 md:flex-row md:justify-end">
      <AppButton
        variant="secondary"
        text-size="sm"
        class="py-1.5"
        @click="emit('cancel')"
      >
        Cancel
      </AppButton>
      <AppButton
        variant="primary"
        text-size="sm"
        class="py-1.5"
        :disabled="!canSubmit"
        @click="handleSubmit"
      >
        {{ saving ? "Creating..." : "Create folder" }}
      </AppButton>
    </div>
  </div>
</template>
