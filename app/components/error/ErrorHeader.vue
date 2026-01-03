<script setup lang="ts">
const props = defineProps<{
  statusCode: number;
  title: string;
  message: string;
  isDark?: boolean;
}>();

const { getThemeClasses } = useErrorPage();
const theme = computed(() => getThemeClasses(props.isDark).header);
</script>

<template>
  <div class="space-y-8">
    <!-- Error Code -->
    <div>
      <h1 class="font-semibold" :class="theme.code">
        {{ statusCode }}
      </h1>
      <h2 class="mt-1" :class="theme.title">
        <span>{{ title }}</span>
      </h2>
    </div>

    <!-- Message -->
    <p :class="theme.message">
      {{ message }}
    </p>

    <slot />
  </div>
</template>
