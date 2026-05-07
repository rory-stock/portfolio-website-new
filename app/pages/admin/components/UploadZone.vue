<script setup lang="ts">
import BaseUploadZone from "~/pages/admin/components/BaseUploadZone.vue";

const props = defineProps<{
  context: string;
}>();

const emit = defineEmits<{
  uploaded: [];
}>();
</script>

<template>
  <BaseUploadZone :context="props.context" @uploaded="emit('uploaded')" />
</template>
