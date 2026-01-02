import { requireAuth } from "~~/server/utils/requireAuth";
import { getMetaImagePath, isValidMetaContext } from "~/utils/meta";
import type {
  MetaCachePurgeRequest,
  MetaCachePurgeResponse,
} from "~~/types/api";
import { logger } from "~/utils/logger";

export default defineEventHandler(
  async (event): Promise<MetaCachePurgeResponse> => {
    await requireAuth(event);

    const body = await readBody<MetaCachePurgeRequest>(event);
    const { context } = body;

    // Validate context
    if (!isValidMetaContext(context)) {
      throw createError({
        statusCode: 400,
        message: "Invalid context",
      });
    }

    const config = useRuntimeConfig();
    const r2Path = getMetaImagePath(context);
    const fileUrl = `${config.r2PublicUrl}/${r2Path}`;

    // Check if Cloudflare credentials are configured
    if (!config.cloudflareApiToken || !config.cloudflareZoneId) {
      logger.warn(
        "Cloudflare cache purge attempted but credentials not configured"
      );
      return {
        success: true,
        purged: false,
        url: fileUrl,
      };
    }

    try {
      // Purge the specific file from the Cloudflare cache
      const purgeResponse = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${config.cloudflareZoneId}/purge_cache`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.cloudflareApiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            files: [fileUrl],
          }),
        }
      );

      const result = await purgeResponse.json();

      if (!purgeResponse.ok || !result.success) {
        logger.error("Cloudflare cache purge failed", result);
        throw createError({
          statusCode: 500,
          message: "Failed to purge Cloudflare cache",
        });
      }

      return {
        success: true,
        purged: true,
        url: fileUrl,
      };
    } catch (error: any) {
      logger.error("Cloudflare cache purge error", error);
      throw createError({
        statusCode: 500,
        message: error.message || "Failed to purge cache",
      });
    }
  }
);
