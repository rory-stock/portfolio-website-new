<script setup lang="ts">
import { computed } from "vue";
import { iconData, type IconName, type IconElement } from "./icons/iconData";

const props = withDefaults(
  defineProps<{
    name: IconName;
    size?: number;

    fill?: string;
    stroke?: string;
    strokeWidth?: string | number;
    opacity?: string | number;

    title?: string;
    decorative?: boolean;
  }>(),
  {
    size: 24,
    decorative: true
  }
);

const icon = computed(() => iconData[props.name]);

const SHARED_KEYS = [
  "fill",
  "stroke",
  "stroke-width",
  "opacity",
  "fill-opacity",
  "stroke-opacity",
  "fill-rule",
  "clip-rule",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
] as const;

const ELEMENT_KEYS: Record<IconElement["type"], readonly string[]> = {
  path: ["d", ...SHARED_KEYS],
  circle: ["cx", "cy", "r", ...SHARED_KEYS],
  line: ["x1", "y1", "x2", "y2", ...SHARED_KEYS],
};

const CAMEL_TO_KEBAB: Record<string, string> = {
  fillOpacity: "fill-opacity",
  strokeOpacity: "stroke-opacity",
  strokeWidth: "stroke-width",
  strokeLinecap: "stroke-linecap",
  strokeLinejoin: "stroke-linejoin",
  strokeMiterlimit: "stroke-miterlimit",
  fillRule: "fill-rule",
  clipRule: "clip-rule",
};

function toSvgAttrs(
  source: Record<string, unknown>,
  allowed: readonly string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    if (value == null) continue;
    const svgKey = CAMEL_TO_KEBAB[key] ?? key;
    if (allowed.includes(svgKey)) {
      result[svgKey] = value;
    }
  }
  return result;
}

/**
 * Final attributes for an element
 * Priority: component props > element-level > icon-level defaults
 */
function resolve(el: IconElement): Record<string, unknown> {
  const allowed = ELEMENT_KEYS[el.type];

  // Layer 1: icon-level defaults (lowest priority)
  const iconAttrs = toSvgAttrs(
    icon.value as unknown as Record<string, unknown>,
    allowed
  );
  // Layer 2: element-level overrides
  const elAttrs = toSvgAttrs(el as unknown as Record<string, unknown>, allowed);

  // Layer 3: component prop overrides (highest priority)
  const propOverrides: Record<string, unknown> = {};
  if (props.fill != null) propOverrides.fill = props.fill;
  if (props.stroke != null) propOverrides.stroke = props.stroke;
  if (props.strokeWidth != null)
    propOverrides["stroke-width"] = props.strokeWidth;
  if (props.opacity != null) propOverrides.opacity = props.opacity;

  const result = { ...iconAttrs, ...elAttrs, ...propOverrides };

  if (result.fill == null) result.fill = "currentColor";
  if (result.stroke == null) result.stroke = "none";

  return result;
}
</script>

<template>
  <svg
    :viewBox="icon.viewBox"
    :width=props.size
    :height=props.size
    xmlns="http://www.w3.org/2000/svg"
    :aria-hidden="decorative || !title"
    :role="decorative ? undefined : 'img'"
  >
    <title v-if="title">{{ title }}</title>
    <component
      v-for="(el, i) in icon.elements"
      :key="i"
      :is="el.type"
      v-bind="resolve(el)"
    />
  </svg>
</template>
