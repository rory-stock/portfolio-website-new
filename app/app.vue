<script setup lang="ts">
useHead({
  titleTemplate: (title) =>
    title
      ? `Rory Stock - ${title}`
      : "Rory Stock - New Zealand Based Photographer",
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
