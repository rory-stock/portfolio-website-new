import { VALID_CONTEXTS } from "~/utils/context";
import { requireAuth } from "~~/server/utils/requireAuth";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  return { contexts: VALID_CONTEXTS };
});
