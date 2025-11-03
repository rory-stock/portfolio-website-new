<script setup lang="ts">
defineProps({
  isOpen: Boolean,
});
const route = useRoute();

const links = [
  { to: "/", name: "index", label: "Home" },
  { to: "/journal", name: "journal", label: "Journal" },
  { to: "/info", name: "info", label: "Info" },
];
</script>

<template>
  <div class="md:hidden">
    <Teleport to="#mobile-menu-teleport">
      <div
        class="absolute z-50 w-full bg-black transition-all duration-500 ease-in-out md:hidden"
        :class="isOpen ? 'block h-screen' : 'h-0'"
      >
        <!--------------------- MOBILE MENU --------------------->
        <div
          class="h-full items-center justify-center gap-4 text-3xl font-bold"
          :class="isOpen ? 'flex animate-menu-item-fade flex-col' : 'hidden'"
        >
          <NuxtLink
            v-for="link in links"
            :key="link.name"
            :to="link.to"
            :class="route.name === link.name ? 'text-blue-499' : 'text-white'"
          >
            {{ link.label }}
          </NuxtLink>
          <!------------------------------------------------------->
        </div>
      </div>
    </Teleport>
  </div>
</template>
