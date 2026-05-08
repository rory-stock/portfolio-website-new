import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ==================== Content Table (unchanged) ====================
export const content = sqliteTable("content", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  table: text("table").notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// ==================== Base Images - Universal Image Data ====================
export const baseImages = sqliteTable("base_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  r2Path: text("r2_path").notNull().unique(),
  url: text("url").notNull(),
  alt: text("alt").notNull().default(""),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  fileSize: integer("file_size").notNull(),
  originalFilename: text("original_filename").notNull(),
  capturedAt: integer("captured_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ==================== Image Instances - Where Images Appear ====================
export const imageInstances = sqliteTable("image_instances", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  imageId: integer("image_id")
    .notNull()
    .references(() => baseImages.id, { onDelete: "cascade" }),
  context: text("context", {
    enum: ["overview", "events", "personal", "info", "galleries"],
  }).notNull(),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  isPrimary: integer("is_primary", { mode: "boolean" })
    .notNull()
    .default(false),
  order: integer("order"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ==================== Image Metadata - Simple Text Metadata ====================
export const imageMetadata = sqliteTable("image_metadata", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  imageInstanceId: integer("image_instance_id")
    .notNull()
    .unique()
    .references(() => imageInstances.id, { onDelete: "cascade" }),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ==================== Layout Groups - Layout Definitions ====================
export const layoutGroups = sqliteTable("layout_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  context: text("context").notNull().default("overview"),
  layoutType: text("layout_type", {
    enum: [
      "fullscreen-hero",
      "single-hero",
      "dual-horizontal",
      "triple-row",
      "asymmetric-left",
      "asymmetric-right",
    ],
  }).notNull(),
  groupDisplayOrder: integer("group_display_order").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ==================== Image Layouts - Links Images to Layouts ====================
export const imageLayouts = sqliteTable("image_layouts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  imageInstanceId: integer("image_instance_id")
    .notNull()
    .unique()
    .references(() => imageInstances.id, { onDelete: "cascade" }),
  layoutGroupId: integer("layout_group_id").references(() => layoutGroups.id, {
    onDelete: "cascade",
  }),
  positionInGroup: integer("position_in_group"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ==================== Image Folders - Generic Container for Organized Images ====================
export const imageFolders = sqliteTable("image_folders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  parentFolderId: integer("parent_folder_id"),
  folderType: text("folder_type", {
    enum: ["event", "gallery", "project"],
  }).notNull(),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
  coverImageId: integer("cover_image_id"),
  imageCount: integer("image_count").notNull().default(0),
  isPrivateLink: integer("is_private_link", { mode: "boolean" })
    .notNull()
    .default(false),
  privateLinkToken: text("private_link_token"),
  accessCode: text("access_code"),
  requireEmail: integer("require_email", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ==================== Folder Images - Links Folders to Image Instances ====================
export const folderImages = sqliteTable("folder_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  folderId: integer("folder_id")
    .notNull()
    .references(() => imageFolders.id, { onDelete: "cascade" }),
  imageInstanceId: integer("image_instance_id")
    .notNull()
    .references(() => imageInstances.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ==================== Events - Event Records ====================
export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  parentEventId: integer("parent_event_id"),
  folderId: integer("folder_id").references(() => imageFolders.id),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  location: text("location").notNull(),
  description: text("description"),
  externalUrl: text("external_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ==================== Galleries - Client Gallery Records ====================
export const galleries = sqliteTable("galleries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  folderId: integer("folder_id")
    .notNull()
    .references(() => imageFolders.id),
  clientName: text("client_name"),
  shootDate: text("shoot_date"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ==================== Folder Access Emails - Tracks Email Gate Submissions ====================
export const folderAccessEmails = sqliteTable("folder_access_emails", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  folderId: integer("folder_id")
    .notNull()
    .references(() => imageFolders.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  accessedAt: integer("accessed_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
