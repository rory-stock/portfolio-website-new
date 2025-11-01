<script setup lang="ts">
const currentTime = ref("");

const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString("en-NZ", {
    timeZone: "Pacific/Auckland",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

let intervalId: number;

onMounted(() => {
  updateTime();
  intervalId = setInterval(updateTime, 1000);
});

onBeforeUnmount(() => {
  clearInterval(intervalId);
});
</script>

<template>
  <p>{{ currentTime }}</p>
</template>
