CREATE TABLE `base_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`r2_path` text NOT NULL,
	`url` text NOT NULL,
	`alt` text DEFAULT '' NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`file_size` integer NOT NULL,
	`original_filename` text NOT NULL,
	`captured_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `base_images_r2_path_unique` ON `base_images` (`r2_path`);--> statement-breakpoint
CREATE TABLE `event_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`image_instance_id` integer NOT NULL,
	`is_cover` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`image_instance_id`) REFERENCES `image_instances`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`location` text NOT NULL,
	`description` text,
	`external_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_slug_unique` ON `events` (`slug`);--> statement-breakpoint
CREATE TABLE `image_instances` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`image_id` integer NOT NULL,
	`context` text NOT NULL,
	`is_public` integer DEFAULT true NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`order` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`image_id`) REFERENCES `base_images`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `image_layouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`image_instance_id` integer NOT NULL,
	`layout_group_id` integer,
	`position_in_group` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`image_instance_id`) REFERENCES `image_instances`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`layout_group_id`) REFERENCES `layout_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `image_layouts_image_instance_id_unique` ON `image_layouts` (`image_instance_id`);--> statement-breakpoint
CREATE TABLE `image_metadata` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`image_instance_id` integer NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`image_instance_id`) REFERENCES `image_instances`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `image_metadata_image_instance_id_unique` ON `image_metadata` (`image_instance_id`);--> statement-breakpoint
CREATE TABLE `layout_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`context` text DEFAULT 'overview' NOT NULL,
	`layout_type` text NOT NULL,
	`group_display_order` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
