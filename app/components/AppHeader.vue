<script setup lang="ts"></script>

<template>
  <header>
    <div class="flex flex-col align-middle">
      <div
        class="md:pt2.5 flex items-center justify-between pt-1.5 pb-1.5 select-none md:pb-2.5"
      >
        <h1
          class="pt-0.5 pl-3 font-neue-montreal-medium lg:font-neue-montreal-medium-bold text-4xl font-semibold uppercase md:pt-1.5 md:pl-6 lg:text-5xl"
        >
          Rory Stock
        </h1>
        <div>
          <MobileNav />
          <DesktopNav />
        </div>
      </div>

      <div class="h-[0.22rem] w-screen bg-black"></div>
    </div>
    <div id="mobile-menu-teleport" class="md:hidden"></div>
  </header>
</template>

<style scoped></style>
