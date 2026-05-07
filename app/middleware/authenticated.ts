import { createAuthError } from "~~/server/utils/errors";

export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useUserSession();

  if (!loggedIn.value) {
    throw createAuthError("UNAUTHENTICATED");
  }
});
