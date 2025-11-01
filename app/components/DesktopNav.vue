<script setup lang="ts">
const route = useRoute();

const links = [
  { to: "/", name: "index", label: "Home" },
  { to: "/journal", name: "journal", label: "Journal" },
  { to: "/info", name: "info", label: "Info" },
];

const getLinkClass = (name: string) => {
  return route.name === name
    ? "text-blue-499"
    : "text-gray-500 hover:text-blue-499 transition-colors duration-100";
};
</script>

<template>
  <nav>
    <ul
      class="font-neue-haas-grotesk-text hidden items-center gap-4 pr-6 font-semibold md:inline-flex md:text-xl lg:text-2xl"
    >
      <li v-for="link in links" :key="link.name">
        <NuxtLink :to="link.to" :class="getLinkClass(link.name)">
          {{ link.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
