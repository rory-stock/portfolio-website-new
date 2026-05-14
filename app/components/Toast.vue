<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
    <TransitionGroup name="slide">
      <div
        v-for="toast in orderedToasts"
        :key="toast.id"
        class="relative max-w-sm overflow-hidden rounded shadow-lg sm:max-w-md"
        :class="toastClasses[toast.type]"
      >
        <!-- Countdown bar -->
        <div
          v-if="toast.duration && toast.duration > 0"
          class="absolute bottom-0 left-0 h-1 bg-current opacity-30"
          id="countdown"
          :class="{
            'transition-all ease-linear': hasCountdownStarted(toast.id),
          }"
          :style="{
            width: hasCountdownStarted(toast.id) ? '0%' : '100%',
            transitionDuration: hasCountdownStarted(toast.id)
              ? toast.duration + 'ms'
              : '0ms',
          }"
        />

        <div class="relative z-10 flex items-center gap-3 px-4 py-3">
          <Icon :name="toastIcons[toast.type]" :size="20" class="shrink-0" />
          <p class="flex-1 text-sm">{{ toast.message }}</p>

          <!-- Action button (Cancel) -->
          <button
            v-if="toast.action"
            @click="toast.action.handler"
            class="shrink-0 text-sm font-medium underline hover:opacity-80"
          >
            {{ toast.action.label }}
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import type { Toast } from "~/composables/useToast";
import type { IconName } from "~/components/icons/iconData";

const { toasts } = useToast();

const orderedToasts = computed(() => [...toasts.value].reverse());

const startedCountdowns = ref<Set<number>>(new Set());

const toastClasses: Record<Toast["type"], string> = {
  success: "bg-green-900 text-green-100 border border-green-700",
  error: "bg-red-900 text-red-100 border border-red-700",
  info: "bg-blue-900 text-blue-100 border border-blue-700",
  successMono: "bg-black select-none text-white [&_#countdown]:opacity-60",
} as const;

const toastIcons: Record<Toast["type"], IconName> = {
  success: "check",
  error: "cross",
  info: "info",
  successMono: "check",
};

function hasCountdownStarted(toastId: number): boolean {
  return startedCountdowns.value.has(toastId);
}

// Start countdown animation after toast is added to DOM
watch(
  toasts,
  (newToasts) => {
    newToasts.forEach((toast) => {
      if (toast.duration && !startedCountdowns.value.has(toast.id)) {
        nextTick(() => {
          startedCountdowns.value.add(toast.id);
        });
      }
    });
  },
  { deep: true }
);

// Clean up removed toasts from the set
watch(toasts, (newToasts) => {
  const currentIds = new Set(newToasts.map((t) => t.id));
  startedCountdowns.value.forEach((id) => {
    if (!currentIds.has(id)) {
      startedCountdowns.value.delete(id);
    }
  });
});
</script>
