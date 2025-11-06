<script setup lang="ts">
useHead({
  title: "Journal",
});

useSeoMeta({
  ogImage:
    "https://images.rorystock.com/cdn-cgi/image/w=1200,h=630/meta/journal-og-image.jpg",
  twitterImage:
    "https://images.rorystock.com/cdn-cgi/image/w=1200,h=675/meta/journal-twitter-image.jpg",
});

// const { data: journalEntries } = await useAsyncData("journal", () =>
//   queryCollection("images")
//     .where("type", "journal")
//     .where("publishedAt", { $lte: new Date().toISOString() }) // only show published
//     .sort({ publishedAt: -1 }) // newest first
//     .all()
// );
</script>

<template>
  <div>
    page: Journal
    <!--      <article-->
    <!--        v-for="entry in journalEntries"-->
    <!--        :key="entry.path"-->
    <!--        class="journal-entry"-->
    <!--      >-->
    <!--        <NuxtImg-->
    <!--          :src="entry.path"-->
    <!--          :alt="entry.alt"-->
    <!--          :width="entry.dimensions.width"-->
    <!--          :height="entry.dimensions.height"-->
    <!--          sizes="sm:100vw md:80vw lg:1200px"-->
    <!--          loading="lazy"-->
    <!--        />-->

    <!--        <div v-if="entry.title || entry.description" class="journal-text">-->
    <!--          <h2 v-if="entry.title">{{ entry.title }}</h2>-->
    <!--          <p v-if="entry.description">{{ entry.description }}</p>-->
    <!--        </div>-->
    <!--      </article>-->
  </div>
</template>

<style scoped></style>
