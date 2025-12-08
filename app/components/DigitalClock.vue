<script setup lang="ts">
import { useNow } from "@vueuse/core";

const now = useNow({ interval: 1000 });

const currentTime = computed(() =>
  now.value.toLocaleTimeString("en-NZ", {
    timeZone: "Pacific/Auckland",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
);
</script>

<template>
  <ClientOnly>
    <p>
      {{ currentTime }}
    </p>
    <template #fallback>
      <p>
        --:--:-- --
      </p>
    </template>
  </ClientOnly>
</template>
