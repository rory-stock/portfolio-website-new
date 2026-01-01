import { VALID_CONTEXTS } from "~/utils/context";
import { requireAuth } from "~~/server/utils/requireAuth";
import type { ContextListResponse } from "~~/types/api";

export default defineEventHandler(async (event): Promise<ContextListResponse> => {
  await requireAuth(event);

  return { contexts: VALID_CONTEXTS };
});
