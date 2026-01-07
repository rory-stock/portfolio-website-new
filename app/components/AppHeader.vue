<template>
  <header
    class="bg-white md:fixed md:top-0 md:right-0 md:left-0 md:z-30 md:transition-colors md:duration-500 md:ease-in-out"
    :class="headerClass"
  >
    <div class="flex flex-col align-middle">
      <div
        class="flex items-center justify-between pt-1.5 pb-1.5 select-none md:pb-2.5"
      >
        <h1
          class="pt-0.5 pl-3 font-animo-condensed tracking-tight text-4xl font-light uppercase transition-colors duration-300 md:pt-1.5 md:pl-6 lg:text-5xl"
          :class="isWhiteText ? 'md:text-white' : 'text-black'"
        >
          Rory Stock
        </h1>
        <div>
          <MobileNav />
          <DesktopNav />
        </div>
      </div>
      <div class="h-[0.22rem] w-full bg-black md:hidden"></div>
    </div>
    <div id="mobile-menu-teleport" class="md:hidden"></div>
  </header>
</template>

<script setup lang="ts">
import { headerTransparentRoutes } from "~/composables/useNavigation";

const route = useRoute();
const { isWhiteText } = useHeaderTextColour();

const headerClass = computed(() =>
  headerTransparentRoutes.includes(route.name as string)
    ? "md:bg-transparent"
    : ""
);
</script>
