<script setup lang="ts">
import { type ClassNameValue, twMerge } from "tailwind-merge";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "secondary-simple"
  | "danger"
  | "danger-simple";

type ButtonType = "button" | "submit" | "reset";
type TextSize = "sm" | "md" | "lg";

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    disabled?: boolean;
    loading?: boolean;
    type?: ButtonType;
    textSize?: TextSize;
  }>(),
  {
    variant: "primary",
    type: "button",
    disabled: false,
    loading: false,
    textSize: "md",
  }
);

defineOptions({
  inheritAttrs: false,
});

const attrs = useAttrs();

const baseClasses =
  "cursor-pointer select-none rounded px-2 py-2 transition-all duration-300 md:px-4 disabled:cursor-not-allowed disabled:opacity-50";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-neutral-100 text-neutral-980 hover:bg-neutral-300",
  secondary: "border border-neutral-700 text-neutral-200 hover:bg-neutral-800",
  "secondary-simple": "md:px-2 text-sm text-neutral-600 hover:text-neutral-400",
  danger: "bg-red-800 text-neutral-100 hover:bg-red-900",
  "danger-simple":
    "text-xs border text-red-400 border-red-500 hover:bg-red-950/50 hover:text-red-300 disabled:opacity-50",
};

const externalClass = computed(() => attrs.class as ClassNameValue);

const textSizeClass = computed(() => {
  switch (props.textSize) {
    case "sm":
      return "text-sm";
    case "lg":
      return "text-lg";
    default:
      return "text-base";
  }
});

const buttonClass = computed(() =>
  twMerge(
    baseClasses,
    variantClasses[props.variant],
    textSizeClass.value,
    externalClass.value
  )
);
</script>

<template>
  <button v-bind="$attrs" :type="type" :class="buttonClass" :disabled="disabled || loading">
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
