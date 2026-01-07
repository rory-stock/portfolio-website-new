<template>
  <header class="bg-white md:fixed md:top-0 md:right-0 md:left-0 md:z-30">
    <div class="flex flex-col align-middle">
      <div
        class="flex items-center justify-between pt-1.5 pb-1.5 select-none md:pb-2.5"
      >
        <h1
          class="pt-0.5 pl-3 font-animo-condensed font-light tracking-tight text-black uppercase xs:text-3xl sm:text-4xl md:pt-1.5 md:pl-6 lg:text-5xl"
        >
          Rory Stock
        </h1>
        <NuxtLink
          to="/"
          class="underline-slide flex items-center gap-1 mr-3 font-ghost text-black xs:text-base sm:text-xl md:text-2xl lg:mr-12"
        >
          Portfolio
          <Icon name="back" class="mt-0.5" :size="30" />
        </NuxtLink>
      </div>
    </div>

    <!-- Mobile separator line (matches portfolio header) -->
    <div class="h-[0.22rem] w-full bg-black"></div>
  </header>
</template>
