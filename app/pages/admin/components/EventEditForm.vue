<script setup lang="ts">
import { onKeyStroke } from "@vueuse/core";

interface EventDetail {
  id: number;
  name: string;
  slug: string;
  start_date: string;
  end_date: string | null;
  location: string;
  description: string | null;
  external_url: string | null;
  parent_event_id?: number | null;
}

const props = defineProps<{
  event: EventDetail;
}>();

const emit = defineEmits<{
  updated: [slug: string];
  deleted: [];
  cancel: [];
}>();

const isSubEvent = computed(() => !!props.event.parent_event_id);

const name = ref(props.event.name);
const startDate = ref(props.event.start_date);
const endDate = ref(props.event.end_date || "");
const location = ref(props.event.location);
const description = ref(props.event.description || "");
const externalUrl = ref(props.event.external_url || "");
const saving = ref(false);
const deleting = ref(false);
const error = ref<string | null>(null);

const canSubmit = computed(() => {
  if (!name.value.trim() || !startDate.value) return false;
  if (!isSubEvent.value && !location.value.trim()) return false;
  return !saving.value;
});

async function handleSubmit() {
  if (!name.value.trim() || !startDate.value) {
    error.value = "Name and start date are required";
    return;
  }

  if (!isSubEvent.value && !location.value.trim()) {
    error.value = "Name, start date, and location are required";
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    const response = await $fetch<{ slug: string }>(
      `/api/events/${props.event.id}`,
      {
        method: "PATCH",
        body: {
          name: name.value.trim(),
          start_date: startDate.value,
          end_date: endDate.value || null,
          location: location.value.trim(),
          description: description.value.trim() || null,
          external_url: externalUrl.value.trim() || null,
        },
      }
    );
    emit("updated", response.slug);
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
      <label class="mb-1 block text-xs text-neutral-400">
        Location{{ isSubEvent ? "" : " *" }}
      </label>
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
        {{ deleting ? "Deleting..." : "Delete event" }}
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
