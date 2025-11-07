<script setup lang="ts">
const { data: footer } = await useAsyncData("footer-data", () =>
  queryCollection("footer").first()
);
</script>

<template>
  <footer class="bg-black">
    <!------------------- PERSONAL/CONTACT INFO ------------------->
    <div
      class="px-2 pt-5 pb-5 font-geist text-xs text-white selection:bg-white selection:text-black md:px-5 md:text-base"
    >
      <div class="flex justify-between">
        <!----------------- EMAIL ----------------->
        <div class="flex">
          <p>Email:&nbsp;</p>
          <NuxtLink
            :to="`mailto:${footer?.email}`"
            target="_blank"
            aria-label="Email link"
            class="lowercase underline transition-opacity duration-100 hover:opacity-80"
            >{{ footer?.email }}
          </NuxtLink>
        </div>
        <!----------------------------------------->
        <p>{{ footer?.location }}</p>
      </div>

      <div class="flex justify-between">
        <!----------------- INSTAGRAM ----------------->
        <div class="flex">
          <p>Instagram:&nbsp;</p>
          <NuxtLink
            to="https://www.instagram.com/rorystockphoto/"
            target="_blank"
            aria-label="Instagram profile link"
            class="lowercase underline transition-opacity duration-100 hover:opacity-80"
          >
            @rorystockphoto
          </NuxtLink>
        </div>
        <!----------------------------------------->

        <!---------------- DIGITAL CLOCK ------------------>
        <div class="flex">
          <p>Local Time /&nbsp;</p>
          <DigitalClock />
        </div>
        <!-------------------------------------------------->
      </div>

      <!---------------- Copyright ------------------>
      <div class="mt-7 flex justify-between">
        <p>{{ footer?.copyright }}</p>
        <button @click="navigateTo('/admin', { external: true })" class="cursor-pointer">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18.41"
            height="19"
            viewBox="0 0 496 512"
          >
            <path
              fill="currentColor"
              d="M248 8C111 8 0 119 0 256s111 248 248 248s248-111 248-248S385 8 248 8m0 448c-110.3 0-200-89.7-200-200S137.7 56 248 56s200 89.7 200 200s-89.7 200-200 200m-80-216c17.7 0 32-14.3 32-32s-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32m160 0c17.7 0 32-14.3 32-32s-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32m4 72.6c-20.8 25-51.5 39.4-84 39.4s-63.2-14.3-84-39.4c-8.5-10.2-23.7-11.5-33.8-3.1c-10.2 8.5-11.5 23.6-3.1 33.8c30 36 74.1 56.6 120.9 56.6s90.9-20.6 120.9-56.6c8.5-10.2 7.1-25.3-3.1-33.8c-10.1-8.4-25.3-7.1-33.8 3.1"
            />
          </svg>
        </button>
      </div>
      <!--------------------------------------------->
    </div>
  </footer>
</template>
