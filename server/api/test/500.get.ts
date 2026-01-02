export default defineEventHandler(() => {
  throw createError({
    statusCode: 500,
    statusMessage: "Internal Server Error",
    message: "Database connection failed",
  });
});
