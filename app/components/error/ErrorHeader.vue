<script setup lang="ts">
const props = defineProps<{
  statusCode: number;
  title: string | string[];
  message: string;
  isDark?: boolean;
}>();

const cleanTitle = (title: string | string[]): string => {
  if (Array.isArray(title)) {
    return title.join(" ");
  }
  return title;
};

const codeClass = computed(() =>
  props.isDark
    ? "text-neutral-200 font-ibm-plex-sans text-[8rem] leading-33 lg:text-[12rem] lg:leading-50"
    : "font-ghost text-black fixed right-0 bottom-0 text-[8rem] leading-30 md:text-[15rem] md:leading-60 lg:text-[18rem] lg:leading-70 xl:text-[22rem] xl:leading-80"
);

const titleClass = computed(() =>
  props.isDark
    ? "text-neutral-200 font-ibm-plex-sans flex gap-4 text-3xl md:text-4xl"
    : "font-ghost text-black fixed flex flex-col left-5 top-2 lg:top-3 text-5xl md:text-8xl"
);

const messageClass = computed(() =>
  props.isDark
    ? "font-ibm-plex-sans text-neutral-400 text-lg md:text-xl"
    : "font-ghost text-neutral-900 fixed left-5 top-32 md:top-58 text-lg md:text-2xl"
);

const title1 = computed(() => {
  if (Array.isArray(props.title && !props.isDark)) {
    return props.title[0];
  }
  return cleanTitle(props.title);
});

const title2 = computed(() => {
  if (Array.isArray(props.title && !props.isDark)) {
    return props.title[1];
  }
  return "";
});
</script>

<template>
  <div class="space-y-8">
    <!-- Error Code -->
    <div>
      <h1 class="font-semibold" :class="codeClass">
        {{ statusCode }}
      </h1>
      <h2 class="mt-1" :class="titleClass">
        <span>{{ title1 }}</span>
        <span class="font-ghost-italic">{{ title2 }}</span>
      </h2>
    </div>

    <!-- Message -->
    <p :class="messageClass">
      {{ message }}
    </p>

    <slot />
  </div>
</template>
