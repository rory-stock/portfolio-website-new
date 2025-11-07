import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const content = sqliteTable("content", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  table: text("table").notNull(), // 'info', 'journal', 'overview'
  key: text("key").notNull(), // 'contactHeader', 'bio', etc
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

export const images = sqliteTable("images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  context: text("context").notNull(), // 'profile', 'journal', 'overview'
  r2Path: text("r2_path").notNull(),
  url: text("url").notNull(),
  alt: text("alt").notNull(),
  width: integer("width"),
  height: integer("height"),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});
