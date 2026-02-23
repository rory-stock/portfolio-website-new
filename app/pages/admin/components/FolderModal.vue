<script setup lang="ts">
import BaseModal from "~/pages/admin/components/BaseModal.vue";
import FolderManager from "~/pages/admin/components/FolderManager.vue";

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
  open: boolean;
  folder?: FolderData | null;
  parentFolderId?: number | null;
  defaultFolderType?: "event" | "client_gallery" | "project";
  existingSlugs?: string[];
}>();

const emit = defineEmits<{
  close: [];
  saved: [folder: FolderData];
  deleted: [];
}>();

const modalTitle = computed(() =>
  props.folder ? "Edit Folder" : "New Folder"
);

function onSaved(folder: FolderData) {
  emit("saved", folder);
  emit("close");
}

function onDeleted() {
  emit("deleted");
  emit("close");
}
</script>

<template>
  <BaseModal
    :open="open"
    :title="modalTitle"
    max-width="md"
    @close="emit('close')"
  >
    <FolderManager
      :folder="folder"
      :parent-folder-id="parentFolderId"
      :default-folder-type="defaultFolderType"
      :existing-slugs="existingSlugs"
      @saved="onSaved"
      @deleted="onDeleted"
      @cancel="emit('close')"
    />
  </BaseModal>
</template>
