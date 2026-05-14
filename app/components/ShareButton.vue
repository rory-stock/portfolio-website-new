<script setup lang="ts">
import Tooltip from "~/components/Tooltip.vue";

const props = withDefaults(
  defineProps<{
    url: string;
    accessToken?: string;
    buttonClass?: string;
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
  <Tooltip text="Share">
    <AppButton
      variant="secondary-simple"
      :class="['px-0 py-0 md:px-0', buttonClass]"
      :disabled="isSharing"
      aria-label="Share link"
      @click="handleClick"
    >
      <Icon name="share" :size="iconSize" />
    </AppButton>
  </Tooltip>
</template>
