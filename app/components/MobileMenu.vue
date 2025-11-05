<script setup lang="ts">
defineProps({
  isOpen: Boolean,
});
const route = useRoute();

const links = [
  { to: "/", name: "index", label: "Overview" },
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
          class="h-full text-white items-center justify-center gap-4 text-3xl"
          :class="isOpen ? 'flex animate-menu-item-fade flex-col' : 'hidden'"
        >
          <NuxtLink
            v-for="link in links"
            :key="link.name"
            :to="link.to"
            :class="route.name === link.name ? 'font-ghost-italic italic' : 'font-ghost-regular'"
          >
            {{ link.label }}
          </NuxtLink>
          <!------------------------------------------------------->
        </div>
      </div>
    </Teleport>
  </div>
</template>
