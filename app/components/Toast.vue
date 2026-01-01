<template>
  <div class="fixed top-4 right-4 z-50 space-y-2">
    <TransitionGroup name="slide">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'max-w-sm rounded px-4 py-3 shadow-lg sm:max-w-md',
          toastClasses[toast.type],
        ]"
      >
        <div class="flex items-center gap-3">
          <Icon
            :name="toastIcons[toast.type]"
            :size="20"
            class="shrink-0"
          />
          <p class="flex-1 text-sm">{{ toast.message }}</p>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import type { Toast } from "~/composables/useToast";
import type { IconName } from "~/components/icons/iconData";

const { toasts } = useToast();

const toastClasses: Record<Toast["type"], string> = {
  success: "bg-green-900 text-green-100 border border-green-700",
  error: "bg-red-900 text-red-100 border border-red-700",
  info: "bg-blue-900 text-blue-100 border border-blue-700",
} as const;

const toastIcons: Record<Toast["type"], IconName> = {
  success: "check",
  error: "cross",
  info: "info",
};
</script>
