<script setup lang="ts">
const emit = defineEmits<{
  created: [];
  cancel: [];
}>();

const name = ref("");
const startDate = ref("");
const endDate = ref("");
const location = ref("");
const description = ref("");
const externalUrl = ref("");
const saving = ref(false);
const error = ref<string | null>(null);

async function handleSubmit() {
  if (!name.value.trim() || !startDate.value || !location.value.trim()) {
    error.value = "Name, start date, and location are required";
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    await $fetch("/api/events", {
      method: "POST",
      body: {
        name: name.value.trim(),
        start_date: startDate.value,
        end_date: endDate.value || undefined,
        location: location.value.trim(),
        description: description.value.trim() || undefined,
        external_url: externalUrl.value.trim() || undefined,
      },
    });
    emit("created");
  } catch (err: any) {
    error.value = err.data?.message || "Failed to create event";
  } finally {
    saving.value = false;
  }
}
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
        placeholder="e.g. Cable Bay Enduro 2025"
      />
    </div>

    <!-- Dates -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="mb-1 block text-xs text-neutral-400">Start date *</label>
        <input
          v-model="startDate"
          type="date"
          class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none"
        />
      </div>
      <div>
        <label class="mb-1 block text-xs text-neutral-400">End date</label>
        <input
          v-model="endDate"
          type="date"
          class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none"
        />
      </div>
    </div>

    <!-- Location -->
    <div>
      <label class="mb-1 block text-xs text-neutral-400">Location *</label>
      <input
        v-model="location"
        type="text"
        class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none"
        placeholder="e.g. Cable Bay Adventure Park, Nelson"
      />
    </div>

    <!-- Description -->
    <div>
      <label class="mb-1 block text-xs text-neutral-400">Description</label>
      <textarea
        v-model="description"
        rows="3"
        class="w-full resize-none rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none"
        placeholder="Optional description"
      />
    </div>

    <!-- External URL -->
    <div>
      <label class="mb-1 block text-xs text-neutral-400">External URL</label>
      <input
        v-model="externalUrl"
        type="url"
        class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none"
        placeholder="https://..."
      />
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-2 pt-2">
      <button
        class="rounded border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200 hover:border-neutral-500"
        @click="emit('cancel')"
      >
        Cancel
      </button>
      <button
        :disabled="saving || !name.trim() || !startDate || !location.trim()"
        class="rounded bg-neutral-100 px-4 py-1.5 text-xs font-medium text-neutral-950 hover:bg-white disabled:opacity-30"
        @click="handleSubmit"
      >
        {{ saving ? "Creating..." : "Create event" }}
      </button>
    </div>
  </div>
</template>
