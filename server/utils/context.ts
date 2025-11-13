import { PAGE_CONTEXTS } from "~/composables/useNavigation";

const additionalContexts = ["footer"] as const;

export const VALID_CONTEXTS = [
  ...PAGE_CONTEXTS,
  ...additionalContexts,
] as const;
export type Context = (typeof VALID_CONTEXTS)[number];

// Helper function to validate contexts
export function isValidContext(context: unknown): context is Context {
  return (
    typeof context === "string" && VALID_CONTEXTS.includes(context as Context)
  );
}
