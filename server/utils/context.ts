export const VALID_CONTEXTS = ["home", "journal", "info", "footer"] as const;
export type Context = (typeof VALID_CONTEXTS)[number];

// Helper function to validate contexts
export function isValidContext(context: unknown): context is Context {
  return (
    typeof context === "string" && VALID_CONTEXTS.includes(context as Context)
  );
}
