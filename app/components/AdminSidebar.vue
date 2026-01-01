<script setup lang="ts">
import { useMediaQuery, onKeyStroke } from "@vueuse/core";
import Icon from "~/components/Icon.vue";
import type { IconName } from "~/components/icons/iconData";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { adminPageItems } = useNavigation();

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
  isPublic?: boolean;
}

// Admin-specific items that aren't public pages
const adminOnlyItems: NavItem[] = [];

const footerItem: NavItem = {
  label: "Footer",
  path: "/admin/footer",
  icon: "footer",
};

// Combine all nav items: Dashboard, then pages, then Footer
const navItems = computed(() => [
  ...adminOnlyItems,
  ...adminPageItems.value,
  footerItem,
]);

const { loggedIn, clear } = useUserSession();

const showCleanupModal = ref(false);

provide("isCleanupModalOpen", showCleanupModal);

// Media query for mobile detection
const isMobile = useMediaQuery("(max-width: 767px)");

// Close on the escape key (mobile only)
onKeyStroke("Escape", (e) => {
  if (isMobile.value && props.isOpen) {
    e.preventDefault();
    emit("close");
  }
});

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
  // Close the sidebar on mobile when a navigation item is clicked
  if (isMobile.value) {
    emit("close");
  }
}

function openCleanupModal() {
  showCleanupModal.value = true;
  // Close the sidebar on mobile when clean-up is opened
  if (isMobile.value) {
    emit("close");
  }
}

const route = useRoute();
const isCurrentRoute = (path: string) => route.path === path;

// Base classes for all interactive elements
const baseClasses =
  "flex w-10/12 cursor-pointer items-center gap-2 rounded-lg px-2 py-[0.3rem] text-[0.95rem] select-none md:w-64";

// Computed classes for nav items
const getNavItemClass = (item: NavItem) =>
  computed(() => {
    const isActive = isCurrentRoute(item.path);

    return [
      baseClasses,
      !isActive && "hover:bg-neutral-800 font-light",
      "text-neutral-200 transition-colors duration-200",
      { "opacity-65": item.isPublic === false },
      {
        "bg-neutral-100 text-neutral-950 hover:bg-neutral-300": isActive,
      },
    ];
  }).value;

// Classes for buttons and links
const actionClass = [
  baseClasses,
  "hover:bg-neutral-800 font-light text-neutral-300 border border-neutral-600 transition-colors duration-200",
].join(" ");
</script>

<template>
  <div>
    <!-- Overlay for mobile -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen && isMobile"
        @click="emit('close')"
        class="fixed inset-0 z-30 bg-black/50 md:hidden"
        aria-hidden="true"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      class="fixed inset-0 z-40 flex w-full flex-col justify-between bg-neutral-900 p-4 font-geist text-neutral-100 transition-transform duration-300 ease-in-out md:relative md:inset-auto md:my-4 md:ml-4 md:h-auto md:min-h-[calc(100vh-2rem)] md:w-fit md:translate-x-0 md:p-0"
      :class="isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
      role="navigation"
      :aria-label="isMobile ? 'Mobile navigation menu' : 'Admin navigation'"
    >
      <div>
        <div
          class="mb-4 hidden cursor-pointer items-center rounded-lg py-1 pl-2 text-lg transition-colors select-none hover:bg-neutral-700 md:flex"
        >
          <Icon name="settings" :size="23" class="mr-1.5" />
          <p class="mb-0.5">rorystock.com</p>
        </div>

        <!-- Navigation and Cleanup -->
        <div v-if="loggedIn" class="flex flex-col gap-8">
          <div>
            <p class="mb-1 text-sm text-neutral-400">Pages</p>
            <nav class="flex flex-col gap-2">
              <NuxtLink
                v-for="item in navItems"
                :key="item.path"
                :to="item.path"
                @click="handleNavClick"
                :class="getNavItemClass(item)"
              >
                <Icon :name="item.icon" :size="15" />
                {{ item.label }}
                <span
                  v-if="item.isPublic === false"
                  class="ml-auto text-xs text-neutral-500"
                >
                  Private
                </span>
              </NuxtLink>
            </nav>
          </div>
          <div>
            <p class="mb-1 text-sm text-neutral-400">Functions</p>
            <button @click="openCleanupModal" :class="actionClass">
              <Icon name="cleanup" :size="19" />
              Cleanup
            </button>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <button v-if="loggedIn" @click="logout" :class="actionClass">
          <Icon name="logout" :size="19" />
          Logout
        </button>

        <NuxtLink to="/" :class="actionClass" class="mb-2">
          <Icon name="back" :size="18" />
          Home
        </NuxtLink>
      </div>
    </aside>

    <!-- Cleanup Modal -->
    <OrphanedFilesModal v-model="showCleanupModal" />
  </div>
</template>
