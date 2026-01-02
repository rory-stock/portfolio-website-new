export default defineEventHandler(() => {
  throw createError({
    statusCode: 403,
    statusMessage: "Forbidden",
    message: "You don't have permission to access this resource",
  });
});
