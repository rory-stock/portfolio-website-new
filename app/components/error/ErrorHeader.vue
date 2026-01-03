<script setup lang="ts">
const props = defineProps<{
  statusCode: number;
  title: string | string[];
  message: string;
  isDark?: boolean;
}>();

const { getThemeClasses } = useErrorPage();
const theme = computed(() => getThemeClasses(props.isDark).header);

const cleanTitle = (title: string | string[]): string => {
  if (Array.isArray(title)) {
    return title.join(" ");
  }
  return title;
};

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
      <h1 class="font-semibold" :class="theme.code">
        {{ statusCode }}
      </h1>
      <h2 class="mt-1" :class="theme.title">
        <span>{{ title1 }}</span>
        <span :class="theme.titleItalic">{{ title2 }}</span>
      </h2>
    </div>

    <!-- Message -->
    <p :class="theme.message">
      {{ message }}
    </p>

    <slot />
  </div>
</template>
