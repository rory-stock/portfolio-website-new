export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const config = useRuntimeConfig();

  return {
    r2AccountId: !!config.r2AccountId,
    r2AccessKeyId: !!config.r2AccessKeyId,
    r2SecretAccessKey: !!config.r2SecretAccessKey,
    r2BucketName: !!config.r2BucketName,
    r2PublicUrl: !!config.r2PublicUrl,
    accountIdValue: config.r2AccountId?.substring(0, 4) + "...",
  };
});
