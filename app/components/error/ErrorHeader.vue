<script setup lang="ts">
const props = defineProps<{
  statusCode: number;
  title: string;
  message: string;
  isDark?: boolean;
}>();

const codeColorClass = computed(() =>
  props.isDark ? "text-neutral-200" : "text-black"
);
const titleColorClass = computed(() =>
  props.isDark ? "text-neutral-200" : "text-black"
);
const messageColorClass = computed(() =>
  props.isDark ? "text-neutral-400" : "text-neutral-700"
);
</script>

<template>
  <div class="error-container font-ibm-plex-sans space-y-8">
    <!-- Error Code -->
    <div class="error-code">
      <h1
        class="text-[8rem] leading-none font-semibold md:text-[12rem]"
        :class="codeColorClass"
      >
        {{ statusCode }}
      </h1>
      <h2
        class="mt-1 text-3xl md:text-4xl"
        :class="titleColorClass"
      >
        {{ title }}
      </h2>
    </div>

    <!-- Message -->
    <p class="text-lg md:text-xl" :class="messageColorClass">
      {{ message }}
    </p>

    <slot />
  </div>
</template>

<style scoped>
.error-container {
  animation: fadeIn 0.6s ease-out;
}

.error-code {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
