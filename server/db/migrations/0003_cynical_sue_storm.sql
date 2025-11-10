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
	`exif_data` text,
	`is_primary` integer DEFAULT true NOT NULL,
	`is_public` integer DEFAULT true NOT NULL,
	`order` integer,
	`uploaded_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_images`("id", "context", "r2_path", "url", "alt", "width", "height", "file_size", "original_filename", "exif_data", "is_primary", "is_public", "order", "uploaded_at") SELECT "id", "context", "r2_path", "url", "alt", "width", "height", "file_size", "original_filename", "exif_data", "is_primary", "is_public", "order", "uploaded_at" FROM `images`;--> statement-breakpoint
DROP TABLE `images`;--> statement-breakpoint
ALTER TABLE `__new_images` RENAME TO `images`;--> statement-breakpoint
PRAGMA foreign_keys=ON;