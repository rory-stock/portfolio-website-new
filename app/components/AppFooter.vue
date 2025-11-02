<script setup lang="ts">
const { data: footer } = await useAsyncData("footer-data", () =>
  queryCollection("footer").first()
);
</script>

<template>
  <footer class="bg-black">
    <!------------------- PERSONAL/CONTACT INFO ------------------->
    <div
      class="px-2 pt-5 pb-5 font-neue-text text-xs font-medium text-white selection:bg-white selection:text-black md:px-5 md:text-base"
    >
      <div class="flex justify-between">
        <!----------------- EMAIL ----------------->
        <div class="flex">
          <p>Email:&nbsp;</p>
          <NuxtLink
            :to="`mailto:${footer?.email}`"
            target="_blank"
            aria-label="Email link"
          >
            <p class="lowercase underline">{{ footer?.email }}</p>
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
          >
            <p class="lowercase underline">@rorystockphoto</p>
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
      <p class="mt-5">{{ footer?.copyright }}</p>
      <!--------------------------------------------->
    </div>
  </footer>
</template>
