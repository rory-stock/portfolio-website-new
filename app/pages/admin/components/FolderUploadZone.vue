<script setup lang="ts">
import BaseUploadZone from "~/pages/admin/components/BaseUploadZone.vue";

const props = defineProps<{
  folderId: number;
  folderType: "event" | "gallery" | "project";
}>();

const emit = defineEmits<{
  uploaded: [];
}>();

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
    context="events"
    :on-after-upload="linkImagesToFolder"
    @uploaded="emit('uploaded')"
  />
</template>
