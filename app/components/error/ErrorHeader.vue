<script setup lang="ts">
const props = defineProps<{
  statusCode: number;
  title: string;
  message: string;
  isDark?: boolean;
}>();
</script>

<template>
  <div class="">
    <!-- Error Title -->
    <div class="flex flex-col gap-4 lg:gap-8">
      <h1
        :class="
          isDark
            ? 'md:text-4x flex flex-col font-ibm-plex-sans text-3xl text-neutral-200'
            : 'font-ghost text-black text-2xl xs:text-4xl sm:text-5xl md:text-8xl'
        "
      >
        <span v-if="isDark">Error: {{ statusCode }}</span>
        <span>{{ title }}</span>
      </h1>

      <!-- Error Message -->
      <div class="flex flex-col gap-1 md:gap-2">
        <p
          :class="
            isDark
              ? 'font-ibm-plex-sans text-lg text-neutral-400 md:text-xl'
              : 'font-ghost text-lg text-black md:text-2xl xl:text-4xl'
          "
        >
          {{ message }}
        </p>

        <!-- Recovery hint and error actions slot -->
        <div>
          <slot />
        </div>
      </div>
    </div>

    <!-- Error Code -->
    <h2
      v-if="!isDark"
      class="fixed right-0 bottom-0 font-ghost text-[8rem] leading-30 font-semibold text-black md:text-[15rem] md:leading-50 lg:text-[18rem] lg:leading-60 xl:text-[22rem] xl:leading-70"
    >
      {{ statusCode }}
    </h2>
  </div>
</template>
