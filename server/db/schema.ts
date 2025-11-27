import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const content = sqliteTable("content", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  table: text("table").notNull(), // 'info', 'journal', 'overview', etc
  key: text("key").notNull(), // 'contactHeader', 'bio', etc
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const images = sqliteTable("images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  context: text("context").notNull(),
  r2_path: text("r2_path").notNull(),
  url: text("url").notNull(),
  alt: text("alt").default(""),
  description: text("description").default(""),
  event_name: text("event_name").default(""),
  event_date: text("event_date").default(""),
  event_location: text("event_location").default(""),
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
});
