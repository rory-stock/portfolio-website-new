CREATE TABLE `content` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`table` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`context` text NOT NULL,
	`r2_path` text NOT NULL,
	`url` text NOT NULL,
	`alt` text NOT NULL,
	`width` integer,
	`height` integer,
	`uploaded_at` integer
);
