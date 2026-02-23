<script setup lang="ts">
interface EventDetail {
  id: number;
  name: string;
  slug: string;
  start_date: string;
  end_date: string | null;
  location: string;
  description: string | null;
  external_url: string | null;
}

const props = defineProps<{
  event: EventDetail;
}>();

const emit = defineEmits<{
  updated: [];
  deleted: [];
  cancel: [];
}>();

const name = ref(props.event.name);
const startDate = ref(props.event.start_date);
const endDate = ref(props.event.end_date || "");
const location = ref(props.event.location);
const description = ref(props.event.description || "");
const externalUrl = ref(props.event.external_url || "");
const saving = ref(false);
const deleting = ref(false);
const error = ref<string | null>(null);

async function handleSubmit() {
  if (!name.value.trim() || !startDate.value || !location.value.trim()) {
    error.value = "Name, start date, and location are required";
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    await $fetch(`/api/events/${props.event.id}`, {
      method: "PATCH",
      body: {
        name: name.value.trim(),
        start_date: startDate.value,
        end_date: endDate.value || null,
        location: location.value.trim(),
        description: description.value.trim() || null,
        external_url: externalUrl.value.trim() || null,
      },
    });
    emit("updated");
  } catch (err: any) {
    error.value = err.data?.message || "Failed to update event";
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  const confirmed = window.confirm(
    `Delete "${props.event.name}"? This will also delete all sub-events, folders, and image links.`
  );
  if (!confirmed) return;

  deleting.value = true;
  error.value = null;

  try {
    await $fetch(`/api/events/${props.event.id}`, {
      method: "DELETE",
    });
    emit("deleted");
  } catch (err: any) {
    error.value = err.data?.message || "Failed to delete event";
  } finally {
    deleting.value = false;
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
      />
    </div>

    <!-- Description -->
    <div>
      <label class="mb-1 block text-xs text-neutral-400">Description</label>
      <textarea
        v-model="description"
        rows="3"
        class="w-full resize-none rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none"
      />
    </div>

    <!-- External URL -->
    <div>
      <label class="mb-1 block text-xs text-neutral-400">External URL</label>
      <input
        v-model="externalUrl"
        type="url"
        class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none"
      />
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between pt-2">
      <button
        :disabled="deleting"
        class="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-950/50 hover:text-red-300 disabled:opacity-50"
        @click="handleDelete"
      >
        {{ deleting ? "Deleting..." : "Delete event" }}
      </button>

      <div class="flex gap-2">
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
          {{ saving ? "Saving..." : "Save" }}
        </button>
      </div>
    </div>
  </div>
</template>
