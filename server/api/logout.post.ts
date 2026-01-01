import type { LogoutResponse } from "~~/types/api";

export default defineEventHandler(async (event): Promise<LogoutResponse> => {
  await clearUserSession(event);
  return { success: true };
});
