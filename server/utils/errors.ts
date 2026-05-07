/**
 * Centralized error definitions
 */

interface ErrorDefinition {
  statusCode: number;
  message: string;
}

const ERROR_MAP = {
  UNAUTHENTICATED: {
    statusCode: 401,
    message: "Authentication required",
  },
  FORBIDDEN: {
    statusCode: 403,
    message: "Access denied",
  },
} as const satisfies Record<string, ErrorDefinition>;

export type ErrorCode = keyof typeof ERROR_MAP;

/**
 * Create a consistent auth/access error.
 * Uses the default message from ERROR_MAP unless overridden.
 *
 * @param code - Error code from ERROR_MAP
 * @param message - Optional custom message (overrides default)
 */
export function createAuthError(code: ErrorCode, message?: string) {
  const definition = ERROR_MAP[code];

  return createError({
    statusCode: definition.statusCode,
    statusMessage: code,
    message: message ?? definition.message,
  });
}
