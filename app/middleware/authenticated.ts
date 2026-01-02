export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: "You don't have permission to view this page",
    });
  }
})
