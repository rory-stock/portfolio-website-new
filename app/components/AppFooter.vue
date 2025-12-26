<script setup lang="ts">
const { content: footer } = await useContentData("footer", true);
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
            :to="`https://www.instagram.com/${footer?.instagram}/`"
            target="_blank"
            aria-label="Instagram profile link"
            class="lowercase underline transition-opacity duration-100 hover:opacity-80"
          >
            @{{ footer?.instagram }}
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
        <button @click="navigateTo('/admin')" class="cursor-pointer">
          <Icon name="smile" width="18.41" height="19" />
        </button>
      </div>
      <!--------------------------------------------->
    </div>
  </footer>
</template>
