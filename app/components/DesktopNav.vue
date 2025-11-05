<script setup lang="ts">
const route = useRoute();

const links = [
  { to: "/", name: "index", label: "Overview" },
  { to: "/journal", name: "journal", label: "Journal" },
  { to: "/info", name: "info", label: "Info" },
];

const getLinkClass = (name: string) => {
  return route.name === name
    ? "font-ghost-italic italic"
    : "font-ghost-regular hover:font-ghost-italic hover:italic";
};
</script>

<template>
  <nav>
    <ul
      class="hidden items-center gap-4 pt-1 pr-6 text-black md:inline-flex md:text-xl lg:text-3xl"
    >
      <li v-for="link in links" :key="link.name">
        <NuxtLink :to="link.to" :class="getLinkClass(link.name)">
          {{ link.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
