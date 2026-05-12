<script setup lang="ts">
const galleryNavItems = computed(() => [
  {
    to: "/",
    name: "index",
    label: "Portfolio",
  },
]);
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header class="bg-white md:fixed md:top-0 md:right-0 md:left-0 md:z-30">
      <div class="flex flex-col align-middle">
        <div
          class="flex items-center justify-between pt-1.5 pb-1.5 select-none md:pb-2.5"
        >
          <h1
            class="pt-0.5 pl-3 font-animo-condensed text-4xl font-light tracking-tight text-black uppercase transition-colors duration-300 md:pt-1.5 md:pl-6 lg:text-5xl"
          >
            Rory Stock
          </h1>
          <div>
            <MobileNav :nav-items="galleryNavItems" />
            <DesktopNav :nav-items="galleryNavItems" />
          </div>
        </div>
        <div class="h-[0.22rem] w-full bg-black"></div>
      </div>
      <div id="mobile-menu-teleport" class="md:hidden"></div>
    </header>
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
