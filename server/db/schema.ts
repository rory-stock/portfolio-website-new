import {
  sqliteTable,
  text,
  integer,
  index,
  unique,
} from "drizzle-orm/sqlite-core";

// ===== CONTENT TABLE =====
export const content = sqliteTable(
  "content",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    context: text("context").notNull(),
    key: text("key").notNull(),
    value: text("value").notNull(),
    created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date()
    ),
    updated_at: integer("updated_at", { mode: "timestamp" }).$onUpdate(
      () => new Date()
    ),
  },
  (table) => [unique("content_context_key_unique").on(table.context, table.key)]
);

// ===== CORE IMAGES TABLE =====
export const images = sqliteTable(
  "images",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    context: text("context").notNull(),
    r2_path: text("r2_path").notNull(),
    url: text("url").notNull(),
    alt: text("alt").default(""),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    file_size: integer("file_size").notNull(),
    original_filename: text("original_filename").notNull(),
    is_public: integer("is_public", { mode: "boolean" }).default(true),
    uploaded_at: integer("uploaded_at", { mode: "timestamp" }).notNull(),
    updated_at: integer("updated_at", { mode: "timestamp" }).$onUpdate(
      () => new Date()
    ),
  },
  (table) => [
    index("context_idx").on(table.context),
    index("r2_path_idx").on(table.r2_path),
  ]
);

// ===== OVERVIEW METADATA =====
export const images_overview_metadata = sqliteTable(
  "images_overview_metadata",
  {
    image_id: integer("image_id")
      .primaryKey()
      .references(() => images.id, { onDelete: "cascade" }),
    is_primary: integer("is_primary", { mode: "boolean" }).default(false),
    display_order: integer("display_order"),
    layout_type: text("layout_type"),
    layout_group_id: integer("layout_group_id"),
    group_display_order: integer("group_display_order"),
    created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date()
    ),
    updated_at: integer("updated_at", { mode: "timestamp" }).$onUpdate(
      () => new Date()
    ),
  }
);

// ===== PERSONAL METADATA =====
export const images_personal_metadata = sqliteTable(
  "images_personal_metadata",
  {
    image_id: integer("image_id")
      .primaryKey()
      .references(() => images.id, { onDelete: "cascade" }),
    description: text("description").default(""),
    display_order: integer("display_order"),
    created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date()
    ),
    updated_at: integer("updated_at", { mode: "timestamp" }).$onUpdate(
      () => new Date()
    ),
  }
);

// ===== INFO METADATA =====
export const images_info_metadata = sqliteTable("images_info_metadata", {
  image_id: integer("image_id")
    .primaryKey()
    .references(() => images.id, { onDelete: "cascade" }),
  is_primary: integer("is_primary", { mode: "boolean" }).default(false),
  display_order: integer("display_order"),
  created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updated_at: integer("updated_at", { mode: "timestamp" }).$onUpdate(
    () => new Date()
  ),
});

// ===== EVENTS METADATA TABLE =====
export const events_metadata = sqliteTable("events_metadata", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  event_name: text("event_name").notNull().unique(),
  event_slug: text("event_slug").notNull().unique(),
  event_date: text("event_date").notNull(),
  event_location: text("event_location").notNull(),
  event_cover_image_id: integer("event_cover_image_id"),
  is_public: integer("is_public", { mode: "boolean" }).default(true),
  created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updated_at: integer("updated_at", { mode: "timestamp" }).$onUpdate(
    () => new Date()
  ),
});

// ===== EVENTS SUBPAGES TABLE =====
export const events_subpages = sqliteTable(
  "events_subpages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    event_id: integer("event_id")
      .notNull()
      .references(() => events_metadata.id, { onDelete: "cascade" }),
    subpage_name: text("subpage_name").notNull(),
    subpage_slug: text("subpage_slug").notNull(),
    subpage_date: text("subpage_date").notNull(),
    subpage_cover_image_id: integer("subpage_cover_image_id"),
    display_order: integer("display_order").default(0),
    created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date()
    ),
    updated_at: integer("updated_at", { mode: "timestamp" }).$onUpdate(
      () => new Date()
    ),
  },
  (table) => [
    unique("events_subpages_event_id_subpage_slug_unique").on(
      table.event_id,
      table.subpage_slug
    ),
    index("event_subpages_event_idx").on(table.event_id),
  ]
);

// ===== EVENTS IMAGES METADATA =====
export const images_events_metadata = sqliteTable(
  "images_events_metadata",
  {
    image_id: integer("image_id")
      .primaryKey()
      .references(() => images.id, { onDelete: "cascade" }),
    event_id: integer("event_id")
      .notNull()
      .references(() => events_metadata.id, { onDelete: "cascade" }),
    event_subpage_id: integer("event_subpage_id").references(
      () => events_subpages.id,
      { onDelete: "cascade" }
    ),
    created_at: integer("created_at", { mode: "timestamp" }).$defaultFn(
      () => new Date()
    ),
    updated_at: integer("updated_at", { mode: "timestamp" }).$onUpdate(
      () => new Date()
    ),
  },
  (table) => [
    index("images_events_metadata_idx").on(table.event_id),
    index("images_events_metadata_subpage_idx").on(table.event_subpage_id),
  ]
);
