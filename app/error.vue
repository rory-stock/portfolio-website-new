<script setup lang="ts">
defineProps({ error: Object });
</script>

<template>
  <NuxtLayout>
    <div class="flex flex-col pt-4 pl-2 font-geist md:pt-8 md:pl-10">
      <p
        class="mb-1 w-fit rounded bg-black px-2 py-1 text-xs text-white uppercase select-none md:mb-2"
      >
        {{ error?.statusCode || "500" }} Error
      </p>

      <h1
        class="text-2xl font-bold uppercase selection:bg-black selection:text-white md:text-4xl"
      >
        {{
          error?.statusCode === 404 ? "Page Not Found" : "Something Went Wrong"
        }}
      </h1>

      <p
        class="text-lg text-black selection:bg-black selection:text-white md:text-xl md:font-medium"
      >
        {{ error?.message || "An unexpected error occurred" }}
      </p>

      <NuxtLink
        to="/"
        class="mt-5 flex w-fit items-center gap-1 rounded bg-black px-2 py-1 text-sm text-white transition-opacity select-none hover:opacity-80 md:mt-6 md:px-4 md:py-2"
      >
        Return Home
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-4"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </NuxtLink>
    </div>
  </NuxtLayout>
</template>
