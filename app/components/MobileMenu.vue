<script setup lang="ts">
defineProps({
  isOpen: Boolean,
});
const route = useRoute();
const { publicNavItems } = useNavigation();
</script>

<template>
  <div class="md:hidden">
    <ClientOnly>
      <Teleport to="#mobile-menu-teleport">
        <div
          class="absolute z-50 w-full bg-black transition-all duration-500 ease-in-out md:hidden"
          :class="isOpen ? 'block h-screen' : 'h-0'"
        >
          <!--------------------- MOBILE MENU --------------------->
          <div
            class="h-full items-center justify-center gap-4 text-3xl text-white"
            :class="isOpen ? 'flex animate-menu-item-fade flex-col' : 'hidden'"
          >
            <NuxtLink
              v-for="link in publicNavItems"
              :key="link.name"
              :to="link.to"
              :class="
                route.name === link.name
                  ? 'font-ghost-italic italic'
                  : 'font-ghost'
              "
            >
              {{ link.label }}
            </NuxtLink>
            <!------------------------------------------------------->
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </div>
</template>
