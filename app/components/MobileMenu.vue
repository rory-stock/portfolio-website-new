<template>
  <ClientOnly>
    <Teleport to="#mobile-menu-teleport">
      <div
        class="absolute z-50 w-full bg-black transition-all duration-500 ease-in-out md:hidden"
        :class="menuContainerClass"
      >
        <div
          class="h-full items-center justify-center gap-4 text-3xl text-white"
          :class="menuContentClass"
        >
          <NuxtLink
            v-for="link in publicNavItems"
            :key="link.name"
            :to="link.to"
            :class="getLinkClass(link.name)"
          >
            {{ link.label }}
          </NuxtLink>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
const props = defineProps({
  isOpen: Boolean,
});

const route = useRoute();
const { publicNavItems } = useNavigation();

const menuContainerClass = computed(() =>
  props.isOpen ? "block h-screen" : "h-0"
);

const menuContentClass = computed(() =>
  props.isOpen ? "flex animate-menu-item-fade flex-col" : "hidden"
);

const getLinkClass = (name: string) => {
  return route.name === name ? "font-ghost-italic italic" : "font-ghost";
};
</script>
