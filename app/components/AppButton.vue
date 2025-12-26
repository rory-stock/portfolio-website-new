<script setup lang="ts">
import { twMerge } from "tailwind-merge";

type ButtonVariant = "primary" | "secondary" | "danger";
type ButtonType = "button" | "submit" | "reset";
type ButtonClass = string;

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    disabled?: boolean;
    loading?: boolean;
    type?: ButtonType;
    class?: ButtonClass;
  }>(),
  {
    variant: "primary",
    type: "button",
    disabled: false,
    loading: false,
    class: "",
  }
);

const baseClasses =
  "cursor-pointer rounded px-2 py-2 text-sm transition-all duration-300 md:px-4 md:text-base disabled:cursor-not-allowed disabled:opacity-50";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-neutral-100 text-neutral-980 hover:bg-neutral-300",
  secondary: "border border-neutral-700 text-neutral-200 hover:bg-neutral-800",
  danger: "bg-red-800 text-neutral-100 hover:bg-red-900",
};

const buttonClass = computed(() => {
  return twMerge(baseClasses, variantClasses[props.variant], props.class);
});
</script>

<template>
  <button :type="type" :class="buttonClass" :disabled="disabled || loading">
    <span v-if="loading" class="flex items-center justify-center gap-2">
      <svg
        class="h-4 w-4 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <slot name="loading">Loading...</slot>
    </span>
    <slot v-else />
  </button>
</template>
