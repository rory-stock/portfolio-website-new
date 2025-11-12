<script setup lang="ts">
import Icon from "~/components/Icon.vue";

const isSidebarOpen = ref(false);

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
}

function closeSidebar() {
  isSidebarOpen.value = false;
}

// Close sidebar when window is resized to desktop view
onMounted(() => {
  const handleResize = () => {
    if (window.innerWidth >= 768) {
      isSidebarOpen.value = false;
    }
  };
  window.addEventListener("resize", handleResize);
  onUnmounted(() => window.removeEventListener("resize", handleResize));
});
</script>

<template>
  <main class="flex h-screen bg-neutral-980 md:flex md:gap-4 md:bg-neutral-900">
    <!-- Mobile menu button -->
    <ClientOnly>
      <button
        @click="toggleSidebar"
        class="fixed top-3 right-3 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-neutral-800 text-neutral-100 transition-colors hover:bg-neutral-700 md:hidden"
        aria-label="Toggle menu"
      >
        <Icon v-if="!isSidebarOpen" name="settings" :size="22" />
        <Icon v-else name="cross" :size="22" />
      </button>
    </ClientOnly>

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
