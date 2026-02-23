<script setup lang="ts">
import { generateSlug } from "~/utils/slug";

interface FolderData {
  id: number;
  name: string;
  slug: string;
  parent_folder_id: number | null;
  folder_type: "event" | "client_gallery" | "project";
  is_public: boolean;
  image_count: number;
}

const props = defineProps<{
  folder?: FolderData | null;
  parentFolderId?: number | null;
  defaultFolderType?: "event" | "client_gallery" | "project";
  existingSlugs?: string[];
}>();

const emit = defineEmits<{
  saved: [folder: FolderData];
  deleted: [];
  cancel: [];
}>();

const isEditing = computed(() => !!props.folder);

const name = ref(props.folder?.name || "");
const slug = ref(props.folder?.slug || "");
const folderType = ref(
  props.folder?.folder_type || props.defaultFolderType || "event"
);
const isPublic = ref(props.folder?.is_public ?? false);
const saving = ref(false);
const deleting = ref(false);
const error = ref<string | null>(null);
const slugManuallyEdited = ref(false);

// Auto-generate slug from name (unless manually edited)
watch(name, (newName) => {
  if (!slugManuallyEdited.value && !isEditing.value) {
    slug.value = generateSlug(newName);
  }
});

function onSlugInput() {
  slugManuallyEdited.value = true;
}

async function save() {
  if (!name.value.trim()) {
    error.value = "Name is required";
    return;
  }

  if (!slug.value.trim()) {
    error.value = "Slug is required";
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    if (isEditing.value && props.folder) {
      // Update existing folder
      const data = await $fetch<{ folder: FolderData }>(
        `/api/folders/${props.folder.id}`,
        {
          method: "PATCH",
          body: {
            name: name.value.trim(),
            slug: slug.value.trim(),
            is_public: isPublic.value,
          },
        }
      );
      emit("saved", data.folder);
    } else {
      // Create a new folder
      const data = await $fetch<{ folder: FolderData }>("/api/folders", {
        method: "POST",
        body: {
          name: name.value.trim(),
          slug: slug.value.trim(),
          parent_folder_id: props.parentFolderId || null,
          folder_type: folderType.value,
          is_public: isPublic.value,
        },
      });
      emit("saved", data.folder);
    }
  } catch (err: any) {
    error.value = err.data?.message || "Failed to save folder";
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!props.folder) return;

  const confirmed = window.confirm(
    `Delete "${props.folder.name}"? This will remove all image links (${props.folder.image_count} images).`
  );

  if (!confirmed) return;

  deleting.value = true;
  error.value = null;

  try {
    await $fetch(`/api/folders/${props.folder.id}`, {
      method: "DELETE",
    });
    emit("deleted");
  } catch (err: any) {
    error.value = err.data?.message || "Failed to delete folder";
  } finally {
    deleting.value = false;
  }
}

const folderTypeOptions = [
  { value: "event", label: "Event" },
  { value: "client_gallery", label: "Client Gallery" },
  { value: "project", label: "Project" },
];
</script>

<template>
  <div class="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
    <h3 class="mb-4 text-base font-medium text-neutral-100">
      {{ isEditing ? "Edit Folder" : "New Folder" }}
    </h3>

    <!-- Error -->
    <div
      v-if="error"
      class="mb-4 rounded border border-red-800 bg-red-950/50 px-3 py-2 text-xs text-red-300"
    >
      {{ error }}
    </div>

    <div class="space-y-4">
      <!-- Name -->
      <div>
        <label class="mb-1 block text-xs text-neutral-400">Name</label>
        <input
          v-model="name"
          type="text"
          class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none"
          placeholder="e.g. Cable Bay Enduro 2025"
        />
      </div>

      <!-- Slug -->
      <div>
        <label class="mb-1 block text-xs text-neutral-400">Slug</label>
        <input
          v-model="slug"
          type="text"
          class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none"
          placeholder="cable-bay-enduro-2025"
          @input="onSlugInput"
        />
        <p class="mt-1 text-[11px] text-neutral-600">
          Used in URLs. Auto-generated from name.
        </p>
      </div>

      <!-- Folder type (only for new folders) -->
      <div v-if="!isEditing">
        <label class="mb-1 block text-xs text-neutral-400">Type</label>
        <select
          v-model="folderType"
          class="w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 focus:border-neutral-500 focus:outline-none"
        >
          <option
            v-for="option in folderTypeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <!-- Public toggle -->
      <div class="flex items-center justify-between">
        <div>
          <label class="text-xs text-neutral-400">Public</label>
          <p class="text-[11px] text-neutral-600">
            Visible on the public website
          </p>
        </div>
        <button
          type="button"
          class="relative h-5 w-9 rounded-full transition-colors"
          :class="isPublic ? 'bg-blue-500' : 'bg-neutral-700'"
          @click="isPublic = !isPublic"
        >
          <span
            class="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
            :class="{ 'translate-x-4': isPublic }"
          />
        </button>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-6 flex items-center justify-between">
      <div>
        <button
          v-if="isEditing"
          :disabled="deleting"
          class="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-950/50 hover:text-red-300 disabled:opacity-50"
          @click="handleDelete"
        >
          {{ deleting ? "Deleting..." : "Delete folder" }}
        </button>
      </div>

      <div class="flex gap-2">
        <button
          class="rounded border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200 hover:border-neutral-500"
          @click="emit('cancel')"
        >
          Cancel
        </button>
        <button
          :disabled="saving || !name.trim()"
          class="rounded bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-950 hover:bg-white disabled:opacity-30"
          @click="save"
        >
          {{ saving ? "Saving..." : isEditing ? "Save" : "Create" }}
        </button>
      </div>
    </div>
  </div>
</template>
