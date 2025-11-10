import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import type { H3Event } from "h3";

export function useDB(event: H3Event) {
  const binding = event.context.cloudflare?.env?.DB;
  if (!binding) {
    throw createError({ statusCode: 500, message: "D1 binding not found" });
  }
  return drizzle(binding, { schema });
}
