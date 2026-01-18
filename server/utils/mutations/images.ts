import type { DrizzleD1Database } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import * as schema from "~~/server/db/schema";
import imageSize from "image-size";
import type {
  NewBaseImage,
  NewImageInstance,
  NewImageMetadata,
} from "~~/types/database";
// @ts-expect-error - exif-parser has no type definitions
import ExifParser from "exif-parser";

/**
 * Extract EXIF metadata from image buffer
 * Returns captured_at date or null if unavailable
 */
export async function extractImageMetadata(
  buffer: Buffer
): Promise<Date | null> {
  try {
    const parser = ExifParser.create(buffer);
    const result = parser.parse();

    if (result.tags?.DateTimeOriginal) {
      return new Date(result.tags.DateTimeOriginal * 1000);
    }

    return null;
  } catch (error) {
    // EXIF not available or parsing failed
    return null;
  }
}

/**
 * Create a base_images record
 * Single source of truth for base image creation
 */
export async function createBaseImageRecord(
  db: DrizzleD1Database<typeof schema>,
  data: {
    r2_path: string;
    buffer: Buffer;
    alt?: string;
  },
  r2PublicUrl: string
) {
  // Extract EXIF
  const capturedAt = await extractImageMetadata(data.buffer);

  // Get dimensions
  const dimensions = imageSize(data.buffer);

  // Generate URL
  const url = `${r2PublicUrl}/${data.r2_path}`;
  const filename = data.r2_path.split("/").pop() || "unknown.jpg";

  // Prepare insert data
  const insertData: NewBaseImage = {
    r2Path: data.r2_path,
    url,
    alt: data.alt || "",
    width: dimensions.width || 0,
    height: dimensions.height || 0,
    fileSize: data.buffer.length,
    originalFilename: filename,
    capturedAt: capturedAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Insert
  const [baseImage] = await db
    .insert(schema.baseImages)
    .values(insertData)
    .returning();

  return baseImage;
}

/**
 * Create an image_instances record
 */
export async function createImageInstanceRecord(
  db: DrizzleD1Database<typeof schema>,
  imageId: number,
  context: string,
  options: {
    isPublic?: boolean;
    isPrimary?: boolean;
    order?: number | null;
  } = {}
) {
  const insertData: NewImageInstance = {
    imageId,
    context: context as any, // Type assertion for enum
    isPublic: options.isPublic ?? true,
    isPrimary: options.isPrimary ?? false,
    order: options.order ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [instance] = await db
    .insert(schema.imageInstances)
    .values(insertData)
    .returning();

  return instance;
}

/**
 * Add an image to a context (create instance and optional metadata)
 */
export async function addImageToContext(
  db: DrizzleD1Database<typeof schema>,
  imageId: number,
  context: string,
  options: {
    isPublic?: boolean;
    isPrimary?: boolean;
    order?: number | null;
    description?: string;
  } = {}
) {
  // Check for an existing instance
  const existing = await db
    .select()
    .from(schema.imageInstances)
    .where(
      and(
        eq(schema.imageInstances.imageId, imageId),
        eq(schema.imageInstances.context, context as any)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error(`Image already exists in context: ${context}`);
  }

  // Create instance
  const instance = await createImageInstanceRecord(
    db,
    imageId,
    context,
    options
  );

  // Create metadata if description provided
  let metadata = null;
  if (options.description) {
    const metadataData: NewImageMetadata = {
      imageInstanceId: instance.id,
      description: options.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    [metadata] = await db
      .insert(schema.imageMetadata)
      .values(metadataData)
      .returning();
  }

  return { instance, metadata };
}

/**
 * Delete an image instance
 * If last instance, also delete the base image + R2 file
 */
export async function deleteImageInstance(
  db: DrizzleD1Database<typeof schema>,
  instanceId: number
) {
  // Get the instance to find the base image
  const [instance] = await db
    .select()
    .from(schema.imageInstances)
    .where(eq(schema.imageInstances.id, instanceId));

  if (!instance) {
    throw new Error("Instance not found");
  }

  const imageId = instance.imageId;

  // Delete the instance (cascades to layouts, event_images, metadata)
  await db
    .delete(schema.imageInstances)
    .where(eq(schema.imageInstances.id, instanceId));

  // Check if any instances remain for this base image
  const remainingInstances = await db
    .select()
    .from(schema.imageInstances)
    .where(eq(schema.imageInstances.imageId, imageId));

  let deletedBaseImage = false;
  let r2Path = null;

  if (remainingInstances.length === 0) {
    // Last instance - delete base image
    const [baseImage] = await db
      .select()
      .from(schema.baseImages)
      .where(eq(schema.baseImages.id, imageId));

    if (baseImage) {
      r2Path = baseImage.r2Path;
      await db
        .delete(schema.baseImages)
        .where(eq(schema.baseImages.id, imageId));
      deletedBaseImage = true;
    }
  }

  return {
    deletedInstance: true,
    deletedBaseImage,
    r2Path,
  };
}
