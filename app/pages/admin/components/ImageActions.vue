<template>
  <div
    class="flex flex-col gap-2 border-t border-neutral-800 pt-4 md:flex-row md:gap-3"
  >
    <AppButton
      type="submit"
      :disabled="!hasChanges || saving"
      :loading="saving"
    >
      <template #loading>Saving...</template>
      Save Changes
    </AppButton>

    <AppButton
      variant="secondary"
      type="button"
      @click="emit('discard')"
      :disabled="!hasChanges || saving"
    >
      Discard Changes
    </AppButton>

    <AppButton
      variant="danger"
      type="button"
      @click="emit('delete')"
      :disabled="deleting"
      :loading="deleting"
      class="mt-6 md:mt-0 md:ml-auto"
    >
      <template #loading>Deleting...</template>
      Delete Image
    </AppButton>
  </div>
</template>

<script setup lang="ts">
interface Props {
  hasChanges: boolean;
  saving: boolean;
  deleting: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  discard: [];
  delete: [];
}>();
</script>
