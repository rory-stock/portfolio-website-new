<script setup lang="ts">
const props = defineProps<{
  suggestedPage: string;
  isDark?: boolean;
}>();

const { getThemeClasses } = useErrorPage();
const theme = computed(() => getThemeClasses(props.isDark).recovery);
</script>

<template>
  <div class="recovery-hint font-ibm-plex-sans">
    <p :class="theme.text">
      Did you mean
      <NuxtLink
        :to="suggestedPage"
        class="font-medium underline transition-colors duration-300 hover:opacity-70"
      >
        {{ suggestedPage }}
      </NuxtLink>
    </p>
  </div>
</template>
