<script setup lang="ts">
import type { IconName } from "~/components/icons/iconData";

interface Action {
  label: string;
  icon: IconName;
  onClick?: () => void;
  href?: string;
}

const props = defineProps<{
  actions: Action[];
  isDark?: boolean;
}>();

const { getThemeClasses } = useErrorPage();
const theme = computed(() => getThemeClasses(props.isDark).actions);
</script>

<template>
  <div class="actions-list space-y-3 pt-8" :class="theme.container">
    <component
      v-for="(action, index) in actions"
      :key="action.label"
      :is="action.href ? 'a' : 'button'"
      :href="action.href"
      @click="action.onClick"
      class="action-item group flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border px-2 py-2 text-left transition-all hover:translate-x-1"
      :class="theme.border"
    >
      <span class="flex items-center gap-4">
        <span class="text-sm" :class="theme.number">
          {{ String(index + 1).padStart(2, "0") }}
        </span>
        <span class="text-lg" :class="theme.label">
          {{ action.label }}
        </span>
      </span>
      <Icon
        :name="action.icon"
        :size="20"
        class="transition-colors"
        :class="[theme.icon, { 'rotate-180': action.icon === 'back' }]"
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
