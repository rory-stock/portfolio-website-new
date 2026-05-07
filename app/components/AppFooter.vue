<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";

const { loggedIn } = useUserSession();

const { data: footer } = await useContentData("footer");

const contactEmail = ref("");

onMounted(() => {
  contactEmail.value = footer.value?.email ?? "";
});

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smaller("md");

const adminIconSize = computed(() => (isMobile.value ? 21 : 24));

const authLink = computed(() => {
  return loggedIn.value ? "/admin" : "/login";
});
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
            class="lowercase underline transition-opacity duration-100 hover:opacity-80"
            :to="`mailto:${contactEmail}`"
            external
            aria-label="Contact email link"
          >
            {{ contactEmail }}
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
            external
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
        <!--------------------------------------------->
        <!-------------- ADMIN/LOGIN LINK ------------->
        <button
          @click="navigateTo(authLink)"
          aria-hidden="true"
          class="cursor-pointer"
        >
          <Icon name="smile" :size="adminIconSize" />
        </button>
      </div>
      <!--------------------------------------------->
    </div>
  </footer>
</template>
