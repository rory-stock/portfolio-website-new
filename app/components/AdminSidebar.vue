<script setup lang="ts">
import Icon from "~/components/Icon.vue";
import type { IconName } from "~/components/icons/iconData";

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
</script>

<template>
  <div
    class="my-4 ml-4 flex w-72 flex-col justify-between bg-neutral-900 font-geist text-neutral-100"
  >
    <div>
      <div
        class="mb-4 flex cursor-pointer items-center rounded-lg py-1 pl-2 text-lg transition-colors select-none hover:bg-neutral-700"
      >
        <Icon name="settings" size="23" class="mr-1.5" />
        <p class="mb-0.5">rorystock.com</p>
      </div>
      <nav class="flex flex-col gap-2">
        <NuxtLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.path"
          class="flex cursor-pointer items-center gap-2 rounded-lg bg-neutral-100 px-2 py-1 text-[0.95rem] text-neutral-900 transition-opacity select-none hover:opacity-85"
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
        class="flex cursor-pointer items-center rounded-lg bg-neutral-100 px-2 py-1 text-[0.95rem] text-neutral-900 transition-opacity select-none hover:opacity-85"
      >
        <Icon name="logout" size="19" class="mr-1" />
        Logout
      </button>
      <button
        class="mb-2 flex cursor-pointer items-center rounded-lg bg-neutral-100 px-2 py-1 text-[0.95rem] text-neutral-900 transition-opacity select-none hover:opacity-85"
        @click="navigateTo('/')"
      >
        <Icon name="back" size="18" class="mr-1" />
        Home
      </button>
    </div>
  </div>
</template>
