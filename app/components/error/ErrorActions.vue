<script setup lang="ts">
import type { IconName } from "~/components/icons/iconData";

interface Action {
  label: string;
  icon: IconName;
  destination: string;
  external?: boolean;
}

const props = defineProps<{
  email: string;
}>();

const actions: Action[] = [
  {
    label: "Back to home",
    icon: "back",
    destination: "/",
  },
  {
    label: "Report Issue",
    icon: "back",
    destination: props.email,
    external: true,
  },
];
</script>

<template>
  <div
    class="actions-list mt-6 flex flex-col gap-1 font-ghost lg:mt-8 lg:gap-2"
  >
    <NuxtLink
      v-for="action in actions"
      :key="action.label"
      :to="action.destination"
      :external="action.external ?? false"
      class="group underline-slide flex w-fit cursor-pointer items-center gap-1 text-left text-xl select-none md:text-3xl"
    >
      {{ action.label }}
      <Icon :name="action.icon" class="mt-1 w-8.75 rotate-315 text-black" />
    </NuxtLink>
  </div>
</template>
