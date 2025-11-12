<script setup lang="ts">
import Icon from "~/components/Icon.vue";
import type { IconName } from "~/components/icons/iconData";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const navItems: Array<{ label: string; path: string; icon: IconName }> = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: "dashboard",
  },
  {
    label: "Overview",
    path: "/admin/overview",
    icon: "overview",
  },
  {
    label: "Journal",
    path: "/admin/journal",
    icon: "journal",
  },
  {
    label: "Info",
    path: "/admin/info",
    icon: "info",
  },
  {
    label: "Footer",
    path: "/admin/footer",
    icon: "footer",
  },
];

const { loggedIn, clear } = useUserSession();

async function logout() {
  try {
    await $fetch("/api/logout", { method: "POST" });
    await clear();
    await navigateTo("/");
  } catch {
    alert("Logout failed");
  }
}

function handleNavClick() {
  // Close sidebar on mobile when navigation item is clicked
  if (window.innerWidth < 768) {
    emit("close");
  }
}
</script>

<template>
  <div>
    <!-- Overlay for mobile -->
    <ClientOnly>
      <Transition
        enter-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-300"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isOpen"
          @click="emit('close')"
          class="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-hidden="true"
        />
      </Transition>
    </ClientOnly>

    <!-- Sidebar -->
    <div
      class="fixed inset-0 z-40 flex w-full flex-col justify-between bg-neutral-900 p-4 font-geist text-neutral-100 transition-transform duration-300 ease-in-out md:relative md:inset-auto md:my-4 md:ml-4 md:h-auto md:min-h-[calc(100vh-2rem)] md:w-fit md:translate-x-0 md:p-0"
      :class="isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
    >
      <div>
        <div
          class="mb-4 hidden cursor-pointer items-center rounded-lg py-1 pl-2 text-lg transition-colors select-none hover:bg-neutral-700 md:flex"
        >
          <Icon name="settings" size="23" class="mr-1.5" />
          <p class="mb-0.5">rorystock.com</p>
        </div>
        <nav class="flex flex-col gap-2">
          <NuxtLink
            v-for="item in navItems"
            :key="item.label"
            :to="item.path"
            @click="handleNavClick"
            class="flex w-10/12 cursor-pointer items-center gap-2 rounded-lg bg-neutral-100 px-2 py-1 text-[0.95rem] text-neutral-900 transition-opacity select-none hover:opacity-85 md:w-64"
          >
            <Icon :name="item.icon" :size="15" />
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>
      <div class="flex flex-col gap-2">
        <button
          v-if="loggedIn"
          @click="logout"
          class="flex w-10/12 cursor-pointer items-center rounded-lg bg-neutral-100 px-2 py-1 text-[0.95rem] text-neutral-900 transition-opacity select-none hover:opacity-85 md:w-64"
        >
          <Icon name="logout" size="19" class="mr-1" />
          Logout
        </button>
        <button
          class="mb-2 flex w-10/12 cursor-pointer items-center rounded-lg bg-neutral-100 px-2 py-1 text-[0.95rem] text-neutral-900 transition-opacity select-none hover:opacity-85 md:w-64"
          @click="navigateTo('/')"
        >
          <Icon name="back" size="18" class="mr-1" />
          Home
        </button>
      </div>
    </div>
  </div>
</template>
