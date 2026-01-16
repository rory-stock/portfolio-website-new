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
    enum: ["overview", "events", "personal", "info"],
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

// ==================== Events - Event Records ====================
export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  location: text("location").notNull(),
  description: text("description"),
  externalUrl: text("external_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ==================== Event Images - Links Images to Events ====================
export const eventImages = sqliteTable("event_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  imageInstanceId: integer("image_instance_id")
    .notNull()
    .references(() => imageInstances.id, { onDelete: "cascade" }),
  isCover: integer("is_cover", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ==================== TEMPORARY - Old Schema for Compatibility ====================
// TODO: Remove this after all endpoints are updated
export const images = sqliteTable("images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  context: text("context").notNull(),
  r2_path: text("r2_path").notNull(),
  url: text("url").notNull(),
  alt: text("alt").default(""),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  file_size: integer("file_size").notNull(),
  original_filename: text("original_filename").notNull(),
  is_primary: integer("is_primary", { mode: "boolean" })
    .notNull()
    .default(true),
  is_public: integer("is_public", { mode: "boolean" }).notNull().default(true),
  order: integer("order"),
  uploaded_at: integer("uploaded_at", { mode: "timestamp" }).notNull(),
  description: text("description").default(""),
  event_name: text("event_name").default(""),
  event_date: text("event_date").default(""),
  event_location: text("event_location").default(""),
  layout_type: text("layout_type").default(""),
  layout_group_id: integer("layout_group_id"),
  group_display_order: integer("group_display_order"),
});
