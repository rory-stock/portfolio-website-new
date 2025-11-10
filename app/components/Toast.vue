<template>
  <div class="fixed top-4 right-4 z-50 space-y-2">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'max-w-sm rounded px-4 py-3 shadow-lg',
          toastClasses[toast.type],
        ]"
      >
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm">{{ toast.message }}</p>
          <button
            @click="remove(toast.id)"
            class="text-lg leading-none hover:opacity-70"
          >
            ×
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
const { toasts, remove } = useToast();

const toastClasses = {
  success: "bg-green-900 text-green-100 border border-green-700",
  error: "bg-red-900 text-red-100 border border-red-700",
  info: "bg-blue-900 text-blue-100 border border-blue-700",
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
