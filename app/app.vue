<script setup lang="ts">
useHead({
  titleTemplate: (title) =>
    title
      ? `Rory Stock - ${title}`
      : "Rory Stock - New Zealand Based Photographer",
  bodyAttrs: { class: "bg-white" },
  htmlAttrs: { class: "bg-black" },
});


useSchemaOrg([
  definePerson({
    name: "Rory Stock",
    givenName: "Rory",
    familyName: "Stock",
    gender: "male",
    description: "Commercial and sports photographer based in New Zealand.",
    hasOccupation: {
      "@type": "Occupation",
      name: "Photographer",
    },
    url: "https://rorystock.com",
    sameAs: [
      "https://www.instagram.com/rorystockphoto",
      "https://www.linkedin.com/in/rorystock",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: "hello@rorystock.com",
        contactType: "business",
        availableLanguage: "english",
      },
      {
        "@type": "ContactPoint",
        email: "rorystock06@gmail.com",
        contactType: "personal",
      },
    ],
  }),
]);
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}
</style>
