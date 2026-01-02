<script setup lang="ts">
import type { IconName } from "~/components/icons/iconData";

interface Action {
  number: string;
  label: string;
  icon: IconName;
  onClick?: () => void;
  href?: string;
}

const props = defineProps<{
  actions: Action[];
  isDark?: boolean;
}>();

const textColorClass = computed(() =>
  props.isDark ? "text-neutral-200" : "text-neutral-800"
);
const numberColorClass = computed(() =>
  props.isDark ? "text-neutral-600" : "text-neutral-400"
);
const iconColorClass = computed(() =>
  props.isDark
    ? "text-neutral-600 group-hover:text-neutral-200"
    : "text-neutral-400 group-hover:text-neutral-800"
);
const borderColorClass = computed(() =>
  props.isDark ? "border-neutral-700" : "border-neutral-800"
);
</script>

<template>
  <div class="actions-list space-y-3 pt-8">
    <component
      v-for="action in actions"
      :key="action.number"
      :is="action.href ? 'a' : 'button'"
      :href="action.href"
      @click="action.onClick"
      class="action-item group cursor-pointer hover:translate-x-1 px-2 border flex w-full items-center justify-between gap-4 rounded-xl py-2 text-left transition-all"
      :class="borderColorClass"
    >
      <span
        class="flex items-center gap-4"
        :class="borderColorClass"
      >
        <span class="text-sm" :class="numberColorClass">
          {{ action.number }}
        </span>
        <span class="text-lg" :class="textColorClass">
          {{ action.label }}
        </span>
      </span>
      <Icon
        :name="action.icon"
        :size="20"
        class="transition-colors"
        :class="[iconColorClass, action.icon === 'back' ? 'rotate-180' : '']"
      />
    </component>
  </div>
</template>

<style scoped>
.action-item {
  animation: fadeInUp 0.4s ease-out backwards;
}

.action-item:nth-child(1) {
  animation-delay: 0.1s;
}

.action-item:nth-child(2) {
  animation-delay: 0.15s;
}

.action-item:nth-child(3) {
  animation-delay: 0.2s;
}

.action-item:nth-child(4) {
  animation-delay: 0.25s;
}

.action-item:nth-child(5) {
  animation-delay: 0.3s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
