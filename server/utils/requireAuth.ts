import type { H3Event } from "h3";
import { logger } from "~/utils/logger";

/**
 * Require authentication for API routes
 * Throws 401 error if the user is not authenticated
 * Returns the user session if authenticated
 */
export async function requireAuth(event: H3Event) {
  const session = await getUserSession(event);

  if (!session.user) {
    logger.unauthorized("Unauthorized");
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  return session;
}
