<script setup lang="ts">

const footer = await queryCollection("footer").first();

</script>

<template>
  <footer>
    <div class="bg-black">
      <!------------------- PERSONAL/CONTACT INFO ------------------->
      <div
        class="font-neue-haas-grotesk-text pt-5 pr-2 pb-5 pl-2 text-xs font-medium text-white selection:bg-white selection:bg-none selection:text-black md:pr-5 md:pl-5 md:text-base"
      >
        <div class="flex justify-between">
          <div class="flex">
            <p>Email:&nbsp;</p>
            <NuxtLink
              :to="`mailto:${footer?.email}`"
              target="_blank"
              aria-label="Email link"
              aria-hidden="false"
            >
              <p class="lowercase underline">{{ footer?.email }}</p>
            </NuxtLink>
          </div>
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
              aria-hidden="false"
            >
              <p class="lowercase underline">@rorystockphoto</p>
            </NuxtLink>
          </div>
          <!----------------------------------------->

          <!----------------- DIGITAL TIME ----------------->
          <!-------------------------------------------->
        </div>
        <br />
        <!---------------- Copyright ------------------>
        <p>{{ footer?.copyright }}</p>
        <!--------------------------------------------->
      </div>
    </div>
  </footer>
</template>

<style scoped></style>
