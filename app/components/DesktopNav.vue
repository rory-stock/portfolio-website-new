<template>
  <nav>
    <ul
      class="hidden items-center gap-4 pt-1 pr-6 transition-colors duration-300 md:inline-flex md:text-xl lg:text-3xl"
      :class="isWhiteText ? 'md:text-white' : 'text-black'"
    >
      <li v-for="link in publicNavItems" :key="link.name">
        <NuxtLink :to="link.to" :class="getLinkClass(link.name)">
          {{ link.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute();
const { publicNavItems } = useNavigation();
const { isWhiteText } = useHeaderTextColour();

const getLinkClass = computed(() => (name: string) => {
  return route.name === name
    ? "font-ghost-italic italic"
    : "font-ghost hover:font-ghost-italic hover:italic";
});
</script>
