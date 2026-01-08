ALTER TABLE `content` RENAME COLUMN "table" TO "context";--> statement-breakpoint
CREATE TABLE `events_metadata` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_name` text NOT NULL,
	`event_slug` text NOT NULL,
	`event_date` text NOT NULL,
	`event_location` text NOT NULL,
	`event_cover_image_id` integer,
	`is_public` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_metadata_event_name_unique` ON `events_metadata` (`event_name`);--> statement-breakpoint
CREATE UNIQUE INDEX `events_metadata_event_slug_unique` ON `events_metadata` (`event_slug`);--> statement-breakpoint
CREATE TABLE `events_subpages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`subpage_name` text NOT NULL,
	`subpage_slug` text NOT NULL,
	`subpage_date` text NOT NULL,
	`subpage_cover_image_id` integer,
	`display_order` integer DEFAULT 0,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`event_id`) REFERENCES `events_metadata`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `event_subpages_event_idx` ON `events_subpages` (`event_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `events_subpages_event_id_subpage_slug_unique` ON `events_subpages` (`event_id`,`subpage_slug`);--> statement-breakpoint
CREATE TABLE `images_events_metadata` (
	`image_id` integer PRIMARY KEY NOT NULL,
	`event_id` integer NOT NULL,
	`event_subpage_id` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `events_metadata`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_subpage_id`) REFERENCES `events_subpages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `images_events_metadata_idx` ON `images_events_metadata` (`event_id`);--> statement-breakpoint
CREATE INDEX `images_events_metadata_subpage_idx` ON `images_events_metadata` (`event_subpage_id`);--> statement-breakpoint
CREATE TABLE `images_info_metadata` (
	`image_id` integer PRIMARY KEY NOT NULL,
	`is_primary` integer DEFAULT false,
	`display_order` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `images_overview_metadata` (
	`image_id` integer PRIMARY KEY NOT NULL,
	`is_primary` integer DEFAULT false,
	`display_order` integer,
	`layout_type` text,
	`layout_group_id` integer,
	`group_display_order` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `images_personal_metadata` (
	`image_id` integer PRIMARY KEY NOT NULL,
	`description` text DEFAULT '',
	`display_order` integer,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `content` ADD `created_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `content_context_key_unique` ON `content` (`context`,`key`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`context` text NOT NULL,
	`r2_path` text NOT NULL,
	`url` text NOT NULL,
	`alt` text DEFAULT '',
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`file_size` integer NOT NULL,
	`original_filename` text NOT NULL,
	`is_public` integer DEFAULT true,
	`uploaded_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_images`("id", "context", "r2_path", "url", "alt", "width", "height", "file_size", "original_filename", "is_public", "uploaded_at", "updated_at") SELECT "id", "context", "r2_path", "url", "alt", "width", "height", "file_size", "original_filename", "is_public", "uploaded_at", "updated_at" FROM `images`;--> statement-breakpoint
DROP TABLE `images`;--> statement-breakpoint
ALTER TABLE `__new_images` RENAME TO `images`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `context_idx` ON `images` (`context`);--> statement-breakpoint
CREATE INDEX `r2_path_idx` ON `images` (`r2_path`);
