/**
 * Image variant definitions
 * Using Cloudflare Image Resizing via cdn-cgi/image/ URL pattern
 */

export type ImageVariant = "thumbnail" | "preview" | "original";

interface VariantConfig {
  width: number;
  height: number;
  fit: "cover" | "scale-down" | "contain";
  format: "webp" | "auto";
  quality: number;
}

const VARIANT_CONFIGS: Record<ImageVariant, VariantConfig> = {
  thumbnail: {
    width: 400,
    height: 400,
    fit: "cover",
    format: "webp",
    quality: 80,
  },
  preview: {
    width: 1200,
    height: 800,
    fit: "scale-down",
    format: "webp",
    quality: 85,
  },
  original: {
    width: 3000,
    height: 2000,
    fit: "scale-down",
    format: "auto",
    quality: 90,
  },
};

/**
 * Base CDN domain for images
 */
const CDN_DOMAIN = "https://images.rorystock.com";

/**
 * Get a Cloudflare Image Resizing URL for a given variant
 * Uses cdn-cgi/image/ URL pattern for on-the-fly transformation
 */
export function getImageVariantUrl(
  r2Path: string,
  variant: ImageVariant
): string {
  const config = VARIANT_CONFIGS[variant];
  const params = [
    `w=${config.width}`,
    `h=${config.height}`,
    `fit=${config.fit}`,
    `f=${config.format}`,
    `q=${config.quality}`,
  ].join(",");

  return `${CDN_DOMAIN}/cdn-cgi/image/${params}/${r2Path}`;
}

/**
 * Get the direct R2 URL
 */
export function getR2DirectUrl(r2Path: string): string {
  return `${CDN_DOMAIN}/${r2Path}`;
}

/**
 * Get the appropriate image URL based on context
 * - Admin: R2 direct
 * - Public: CF Image Resizing variant
 */
export function getImageUrl(
  r2Path: string,
  options: {
    variant?: ImageVariant;
    isAdmin?: boolean;
  } = {}
): string {
  const { variant = "preview", isAdmin = false } = options;

  // Admin uses R2 direct to avoid CF Images costs
  if (isAdmin) {
    return getR2DirectUrl(r2Path);
  }

  return getImageVariantUrl(r2Path, variant);
}

/**
 * Get srcset for responsive images
 * Returns thumbnail and preview variants for responsive loading
 */
export function getImageSrcset(r2Path: string): string {
  const thumbnail = getImageVariantUrl(r2Path, "thumbnail");
  const preview = getImageVariantUrl(r2Path, "preview");

  return `${thumbnail} 400w, ${preview} 1200w`;
}
