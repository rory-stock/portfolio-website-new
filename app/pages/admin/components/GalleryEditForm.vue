<script setup lang="ts">
import { onKeyStroke } from "@vueuse/core";

interface GalleryDetail {
  id: number;
  name: string;
  slug: string;
  folder_id: number;
  client_name: string | null;
  shoot_date: string | null;
}

const props = defineProps<{
  gallery: GalleryDetail;
}>();

const emit = defineEmits<{
  updated: [slug: string];
  deleted: [];
  cancel: [];
}>();

const name = ref(props.gallery.name);
const clientName = ref(props.gallery.client_name || "");
const shootDate = ref(props.gallery.shoot_date || "");
const saving = ref(false);
const deleting = ref(false);
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
    const response = await $fetch<{ slug: string }>(
      `/api/galleries/${props.gallery.slug}`,
      {
        method: "PATCH",
        body: {
          name: name.value.trim(),
          client_name: clientName.value.trim() || null,
          shoot_date: shootDate.value || null,
        },
      }
    );
    emit("updated", response.slug);
  } catch (err: any) {
    error.value = err.data?.message || "Failed to update gallery";
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  const confirmed = window.confirm(
    `Delete "${props.gallery.name}"? This will also delete the linked folder and all image links.`
  );
  if (!confirmed) return;

  deleting.value = true;
  error.value = null;

  try {
    await $fetch(`/api/galleries/${props.gallery.slug}`, {
      method: "DELETE",
    });
    emit("deleted");
  } catch (err: any) {
    error.value = err.data?.message || "Failed to delete gallery";
  } finally {
    deleting.value = false;
  }
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

    <!-- Client Name -->
    <div>
      <label class="mb-1 block text-xs text-neutral-400">Client name</label>
      <input
        v-model="clientName"
        type="text"
        class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none"
      />
    </div>

    <!-- Shoot Date -->
    <div>
      <label class="mb-1 block text-xs text-neutral-400">Shoot date</label>
      <input
        v-model="shootDate"
        type="date"
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
        :disabled="deleting"
        @click="handleDelete"
      >
        {{ deleting ? "Deleting..." : "Delete gallery" }}
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
