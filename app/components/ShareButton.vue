<script setup lang="ts" xmlns="http://www.w3.org/1999/html">
import Tooltip from "~/components/Tooltip.vue";

const props = withDefaults(
  defineProps<{
    url: string;
    accessToken?: string;
    buttonClass?: string;
    iconSize?: number;
    icon?: boolean;
    useTooltip?: boolean;
  }>(),
  {
    accessToken: undefined,
    iconSize: 22,
    icon: true,
    useTooltip: true,
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
  <component :is="useTooltip ? Tooltip : 'div'" :text="useTooltip ? 'Share' : undefined">
    <AppButton
      variant="secondary-simple"
      :class="['px-0 py-0 md:px-0', buttonClass]"
      :disabled="isSharing"
      aria-label="Share link"
      @click="handleClick"
    >
      <Icon v-if="icon" name="share" :size="iconSize" />
      <div v-else class="flex min-w-25 flex-col items-start py-1">
        <slot />
      </div>
    </AppButton>
  </component>
</template>
