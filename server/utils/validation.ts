import { VALID_CONTEXTS } from "~/utils/context";

export function validateContext(context: unknown): context is string {
  return typeof context === "string" && VALID_CONTEXTS.includes(context as any);
}

export function validateSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

export function validateDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
