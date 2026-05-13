<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    url: string;
    accessToken?: string;
    class?: string;
    iconSize?: number;
  }>(),
  {
    accessToken: undefined,
    iconSize: 22,
  }
);

const { share, isSharing } = useShare();

async function handleClick(event: MouseEvent) {
  event.stopPropagation();
  event.preventDefault();
  await share(props.url, props.accessToken);
}
</script>

<template>
  <AppButton
    variant="secondary-simple"
    :class="`px-0 py-0 md:px-0 ${props.class}`"
    :disabled="isSharing"
    title="Share"
    aria-label="Share link"
    @click="handleClick"
  >
    <Icon name="share2" :size="iconSize" />
  </AppButton>
</template>
