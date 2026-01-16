import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import * as schema from "../server/db/schema"

// ==================== Select Types (from DB) ====================
export type BaseImage = InferSelectModel<typeof schema.baseImages>;
export type ImageInstance = InferSelectModel<typeof schema.imageInstances>;
export type ImageMetadata = InferSelectModel<typeof schema.imageMetadata>;
export type LayoutGroup = InferSelectModel<typeof schema.layoutGroups>;
export type ImageLayout = InferSelectModel<typeof schema.imageLayouts>;
export type Event = InferSelectModel<typeof schema.events>;
export type EventImage = InferSelectModel<typeof schema.eventImages>;

// ==================== Insert Types (to DB) ====================
export type NewBaseImage = InferInsertModel<typeof schema.baseImages>;
export type NewImageInstance = InferInsertModel<typeof schema.imageInstances>;
export type NewImageMetadata = InferInsertModel<typeof schema.imageMetadata>;
export type NewLayoutGroup = InferInsertModel<typeof schema.layoutGroups>;
export type NewImageLayout = InferInsertModel<typeof schema.imageLayouts>;
export type NewEvent = InferInsertModel<typeof schema.events>;
export type NewEventImage = InferInsertModel<typeof schema.eventImages>;
