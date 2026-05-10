<script setup lang="ts">
import { onKeyStroke } from "@vueuse/core";

const emit = defineEmits<{
  created: [];
  cancel: [];
}>();

const name = ref("");
const clientName = ref("");
const shootDate = ref("");
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
    await $fetch("/api/galleries", {
      method: "POST",
      body: {
        name: name.value.trim(),
        client_name: clientName.value.trim() || undefined,
        shoot_date: shootDate.value || undefined,
      },
    });
    emit("created");
  } catch (err: any) {
    error.value = err.data?.message || "Failed to create gallery";
  } finally {
    saving.value = false;
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
        {{ saving ? "Creating..." : "Create gallery" }}
      </AppButton>
    </div>
  </div>
</template>
