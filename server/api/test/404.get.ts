export default defineEventHandler(() => {
  throw createError({
    statusCode: 404,
    message: "Page not found: /api/test/404",
  });
});
