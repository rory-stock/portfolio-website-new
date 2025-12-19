import { VALID_CONTEXTS } from "~/utils/context";

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  return { contexts: VALID_CONTEXTS };
});
