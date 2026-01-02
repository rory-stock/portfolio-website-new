<template>
  <div class="rounded border border-neutral-800 bg-neutral-900 p-6">
    <h2 class="mb-1 text-xl font-bold text-neutral-100 md:text-2xl">
      Meta Images
    </h2>

    <p class="mb-6 text-sm text-neutral-400/80">
      Upload one image per page at {{ metaImageConstraints.width }}×{{
        metaImageConstraints.height
      }}px. It will be automatically transformed to
      {{ metaImageConstraints.ogWidth }}×{{ metaImageConstraints.ogHeight }}px
      for OpenGraph.
    </p>

    <!-- For each page context -->
    <div class="flex flex-col md:grid md:grid-cols-2 md:gap-5">
      <div
        v-for="context in PAGE_CONTEXTS"
        :key="context"
        class="mb-8 last:mb-0"
      >
        <MetaImageUpload
          :context="context"
          :label="`Meta Image (${metaImageConstraints.width}×${metaImageConstraints.height})`"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PAGE_CONTEXTS } from "~/composables/useNavigation";
import { metaImageConstraints } from "~/utils/constants";
</script>
