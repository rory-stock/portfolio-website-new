<script setup lang="ts">
import type { IconName } from "~/components/icons/iconData";

interface Action {
  label: string;
  icon: IconName;
  onClick?: () => void;
}

const props = defineProps<{
  email: string;
}>();

function handleGoHome() {
  navigateTo("/");
}

function handleReportIssue() {
  window.open(props.email);
}

const actions: Action[] = [
  {
    label: "Back to home",
    icon: "back",
    onClick: handleGoHome,
  },
  {
    label: "Report Issue",
    icon: "back",
    onClick: handleReportIssue,
  },
];
</script>

<template>
  <div
    class="actions-list mt-6 flex flex-col gap-1 font-ghost lg:mt-8 lg:gap-2"
  >
    <p
      v-for="action in actions"
      :key="action.label"
      @click="action.onClick"
      class="group underline-slide flex w-fit cursor-pointer items-center gap-1 text-left text-xl select-none md:text-3xl"
    >
      {{ action.label }}
      <Icon :name="action.icon" class="mt-1 w-8.75 rotate-315 text-black" />
    </p>
  </div>
</template>
