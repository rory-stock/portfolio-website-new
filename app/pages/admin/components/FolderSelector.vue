<script setup lang="ts">
interface FolderOption {
  id: number;
  name: string;
  slug: string;
  parent_folder_id: number | null;
  image_count: number;
  depth: number;
}

const props = withDefaults(
  defineProps<{
    /** Currently selected folder ID */
    modelValue?: number | null;
    /** Folder IDs to exclude from the list (e.g. current folder) */
    excludeIds?: number[];
    /** Folder type filter */
    folderType?: "event" | "gallery" | "project";
    /** Placeholder text */
    placeholder?: string;
  }>(),
  {
    modelValue: null,
    excludeIds: () => [],
    placeholder: "Select folder...",
  }
);

const emit = defineEmits<{
  "update:modelValue": [folderId: number | null];
  select: [folder: FolderOption];
}>();

const open = ref(false);
const search = ref("");
const folders = ref<FolderOption[]>([]);
const loading = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const selectedFolder = computed(
  () => folders.value.find((f) => f.id === props.modelValue) ?? null
);

const filteredFolders = computed(() => {
  let filtered = folders.value.filter((f) => !props.excludeIds.includes(f.id));

  if (search.value.trim()) {
    const q = search.value.toLowerCase();
    filtered = filtered.filter((f) => f.name.toLowerCase().includes(q));
  }

  return filtered;
});

async function fetchFolders() {
  loading.value = true;
  try {
    const query: Record<string, string> = {};
    if (props.folderType) query.folder_type = props.folderType;

    const data = await $fetch<{ folders: FolderOption[] }>("/api/folders", {
      query,
    });
    folders.value = data.folders;
  } catch (err) {
    console.error("Failed to load folders:", err);
  } finally {
    loading.value = false;
  }
}

function selectFolder(folder: FolderOption) {
  emit("update:modelValue", folder.id);
  emit("select", folder);
  open.value = false;
  search.value = "";
}

function clear() {
  emit("update:modelValue", null);
  open.value = false;
  search.value = "";
}

function toggle() {
  open.value = !open.value;
  if (open.value && folders.value.length === 0) {
    void fetchFolders();
  }
}

// Close on click outside
function handleClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    open.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

// Indent string for nested folders
function indent(depth: number): string {
  return "\u00A0\u00A0".repeat(depth);
}
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <!-- Trigger button -->
    <button
      type="button"
      class="flex w-full items-center justify-between rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-left text-sm transition-colors hover:border-neutral-500"
      :class="open ? 'border-neutral-500' : ''"
      @click="toggle"
    >
      <span :class="selectedFolder ? 'text-neutral-200' : 'text-neutral-500'">
        {{ selectedFolder?.name || placeholder }}
      </span>
      <span class="text-neutral-600">▾</span>
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition duration-100"
      enter-from-class="scale-95 opacity-0"
      enter-to-class="scale-100 opacity-100"
      leave-active-class="transition duration-75"
      leave-from-class="scale-100 opacity-100"
      leave-to-class="scale-95 opacity-0"
    >
      <div
        v-if="open"
        class="absolute z-40 mt-1 w-full overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-lg"
      >
        <!-- Search input -->
        <div class="border-b border-neutral-800 p-2">
          <input
            v-model="search"
            type="text"
            class="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs text-neutral-200 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none"
            placeholder="Search folders..."
            @keydown.esc="open = false"
          />
        </div>

        <!-- Loading -->
        <div
          v-if="loading"
          class="px-3 py-4 text-center text-xs text-neutral-500"
        >
          Loading...
        </div>

        <!-- Folder list -->
        <div v-else class="max-h-56 overflow-y-auto">
          <!-- Clear option -->
          <button
            v-if="modelValue"
            class="flex w-full items-center px-3 py-2 text-xs text-neutral-500 hover:bg-neutral-800"
            @click="clear"
          >
            Clear selection
          </button>

          <!-- No results -->
          <div
            v-if="filteredFolders.length === 0"
            class="px-3 py-4 text-center text-xs text-neutral-600"
          >
            No folders found
          </div>

          <!-- Folder options -->
          <button
            v-for="folder in filteredFolders"
            :key="folder.id"
            class="flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-neutral-800"
            :class="
              folder.id === modelValue
                ? 'bg-neutral-800/50 text-neutral-100'
                : 'text-neutral-300'
            "
            @click="selectFolder(folder)"
          >
            <span>
              <span class="text-neutral-700">{{ indent(folder.depth) }}</span>
              {{ folder.name }}
            </span>
            <span class="text-neutral-600">
              {{ folder.image_count }}
            </span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
