<script setup lang="ts">
import EventsHeader from "~/pages/events/components/EventsHeader.vue";

</script>
<template>
  <div class="flex min-h-screen flex-col">
    <EventsHeader />
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
