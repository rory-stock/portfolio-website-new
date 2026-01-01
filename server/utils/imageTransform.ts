import type { ImageBase } from "~~/types/imageTypes";
import type { LayoutTypeId } from "~/utils/layouts";
import { isValidLayoutType } from "~/utils/layouts";
import type { InferSelectModel } from "drizzle-orm";
import type { images } from "~~/server/db/schema";

type DbImage = InferSelectModel<typeof images>;

/**
 * Transform database image record to ImageBase type
 * Validates layout_type and ensures type safety
 */
export function toImageBase(dbImage: DbImage): ImageBase {
  const layout_type: LayoutTypeId | null =
    dbImage.layout_type && isValidLayoutType(dbImage.layout_type)
      ? dbImage.layout_type
      : null;

  return {
    ...dbImage,
    layout_type,
  };
}

/**
 * Transform an array of database image records to ImageBase types
 */
export function toImageBaseArray(dbImages: DbImage[]): ImageBase[] {
  return dbImages.map(toImageBase);
}
