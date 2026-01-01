import { z } from "zod";
import bcrypt from "bcryptjs";
import { logger } from "~/utils/logger";
import type { LoginResponse } from "~~/types/api";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export default defineEventHandler(async (event): Promise<LoginResponse> => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse);
  const config = useRuntimeConfig();

  if (
    email === config.adminEmail &&
    (await bcrypt.compare(password, config.adminPasswordHash))
  ) {
    await setUserSession(event, {
      user: {
        name: "Admin",
        isAdmin: true,
      },
    });
    return { success: true };
  }

  logger.unauthorized("Bad credentials", { email });
  throw createError({
    statusCode: 401,
    message: "Bad credentials",
  });
});
