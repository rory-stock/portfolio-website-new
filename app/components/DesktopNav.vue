<script setup lang="ts">
const route = useRoute();
const { publicNavItems } = useNavigation();

const getLinkClass = (name: string) => {
  return route.name === name
    ? "font-ghost-italic italic"
    : "font-ghost hover:font-ghost-italic hover:italic";
};
</script>

<template>
  <nav>
    <ul
      class="hidden items-center gap-4 pt-1 pr-6 text-black md:inline-flex md:text-xl lg:text-3xl"
    >
      <li v-for="link in publicNavItems" :key="link.name">
        <NuxtLink :to="link.to" :class="getLinkClass(link.name)">
          {{ link.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
