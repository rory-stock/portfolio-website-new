<script setup lang="ts">
import { onKeyStroke } from "@vueuse/core";

interface SubFolder {
  id: number;
  name: string;
  slug: string;
  image_count: number;
}

const props = defineProps<{
  folder: SubFolder;
}>();

const emit = defineEmits<{
  saved: [slug: string];
  deleted: [];
  cancel: [];
}>();

const name = ref(props.folder.name);
const saving = ref(false);
const error = ref<string | null>(null);

const canSubmit = computed(() => {
  return (
    name.value.trim().length > 0 &&
    name.value.trim() !== props.folder.name &&
    !saving.value
  );
});

async function handleSubmit() {
  if (!name.value.trim()) {
    error.value = "Name is required";
    return;
  }

  saving.value = true;
  error.value = null;

  const slug = name.value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  try {
    const response = await $fetch<{ folder: { slug: string } }>(
      `/api/folders/${props.folder.id}`,
      {
        method: "PATCH",
        body: {
          name: name.value.trim(),
          slug,
        },
      }
    );
    emit("saved", response.folder.slug);
  } catch (err: any) {
    error.value = err.data?.message || "Failed to update folder";
  } finally {
    saving.value = false;
  }
}

function handleDelete() {
  emit("deleted");
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
    <div
      class="flex flex-col justify-between gap-2 pt-2 md:flex-row md:items-center md:gap-0"
    >
      <AppButton
        variant="danger"
        text-size="sm"
        class="py-1.5"
        @click="handleDelete"
      >
        Delete folder"
      </AppButton>

      <div class="mt-2 flex flex-col gap-2 md:mt-0 md:flex-row">
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
          {{ saving ? "Saving..." : "Save" }}
        </AppButton>
      </div>
    </div>
  </div>
</template>
