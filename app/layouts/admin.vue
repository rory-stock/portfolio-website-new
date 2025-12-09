<script setup lang="ts">
import Icon from "~/components/Icon.vue";
import { useMediaQuery } from "@vueuse/core";

const isSidebarOpen = ref(false);

// Provide modal state to child components
const modalState = useProvideModalState()!;
const { isAnyModalOpen } = modalState;

const isDesktop = import.meta.client ? useMediaQuery("(min-width: 768px)") : ref(true);

// Close sidebar when switching to desktop
watch(isDesktop, (isDesktop) => {
  if (isDesktop) {
    isSidebarOpen.value = false;
  }
});

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
}

function closeSidebar() {
  isSidebarOpen.value = false;
}
</script>

<template>
  <main class="flex h-screen bg-neutral-980 md:flex md:gap-4 md:bg-neutral-900">
    <!-- Mobile menu button -->
    <button
      v-if="!isAnyModalOpen"
      @click="toggleSidebar()"
      class="fixed top-3 right-3 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-neutral-800 text-neutral-100 transition-colors hover:bg-neutral-700 md:hidden"
      aria-label="Toggle menu"
    >
      <Icon v-if="!isSidebarOpen" name="settings" :size="22" />
      <Icon v-else name="cross" :size="22" />
    </button>

    <!-- Sidebar -->
    <AdminSidebar :is-open="isSidebarOpen" @close="closeSidebar" />

    <!-- Main content -->
    <div
      class="w-full overflow-scroll bg-neutral-980 md:my-2 md:mr-2 md:w-full md:rounded-2xl"
    >
      <slot />
    </div>
  </main>
</template>
