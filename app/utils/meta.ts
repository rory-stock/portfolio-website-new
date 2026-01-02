import { metaImageConstraints } from "./constants";
import { PAGE_CONTEXTS } from "~/composables/useNavigation";

/**
 * Generate a meta-image filename for R2
 * Single image per context, transformed via Cloudflare for different sizes
 * @param context - Page context (overview, journal, etc.)
 * @returns R2 path like "meta/journal-meta-image.jpg"
 */
export function getMetaImagePath(context: string): string {
  return `meta/${context}-meta-image.jpg`;
}

/**
 * Generate OG image URL with Cloudflare transformation
 * Crops the base 1200×675 image to 1200×630 for OpenGraph
 */
export function getOgImageUrl(context: string): string {
  const path = getMetaImagePath(context);
  return `https://images.rorystock.com/cdn-cgi/image/w=${metaImageConstraints.ogWidth},h=${metaImageConstraints.ogHeight},fit=cover/${path}`;
}

/**
 * Generate Twitter image URL with Cloudflare transformation
 * Uses the base 1200×675 image as-is
 */
export function getTwitterImageUrl(context: string): string {
  const path = getMetaImagePath(context);
  return `https://images.rorystock.com/cdn-cgi/image/w=${metaImageConstraints.width},h=${metaImageConstraints.height}/${path}`;
}

/**
 * Validate meta-image context
 * Only allow page contexts (not 'footer')
 */
export function isValidMetaContext(context: string): boolean {
  return PAGE_CONTEXTS.includes(context as any);
}
