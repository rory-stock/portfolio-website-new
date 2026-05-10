<script setup lang="ts">
import BaseUploadZone from "~/pages/admin/components/BaseUploadZone.vue";

const props = defineProps<{
  folderId: number;
  folderType: "event" | "gallery" | "project";
}>();

const emit = defineEmits<{
  uploaded: [];
}>();

// Map folder type to image instance context
const FOLDER_TYPE_TO_CONTEXT: Record<string, string> = {
  gallery: "galleries",
  event: "events",
};

const uploadContext = computed(() => {
  const context = FOLDER_TYPE_TO_CONTEXT[props.folderType];
  if (!context) {
    throw new Error(
      `No upload context for folder type: ${props.folderType}`
    );
  }
  return context;
});

async function linkImagesToFolder(imageIds: number[]) {
  for (const instanceId of imageIds) {
    try {
      await $fetch(`/api/folders/${props.folderId}/images`, {
        method: "POST",
        body: { image_instance_id: instanceId },
      });
    } catch (error) {
      console.error(`Failed to link image ${instanceId} to folder:`, error);
    }
  }
}
</script>

<template>
  <BaseUploadZone
    :context="uploadContext"
    :on-after-upload="linkImagesToFolder"
    @uploaded="emit('uploaded')"
  />
</template>
