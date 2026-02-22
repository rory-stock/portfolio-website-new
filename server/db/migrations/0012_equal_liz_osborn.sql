CREATE TABLE `folder_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`folder_id` integer NOT NULL,
	`image_instance_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`folder_id`) REFERENCES `image_folders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`image_instance_id`) REFERENCES `image_instances`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `image_folders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`parent_folder_id` integer,
	`folder_type` text NOT NULL,
	`is_public` integer DEFAULT false NOT NULL,
	`cover_image_id` integer,
	`image_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `events` ADD `parent_event_id` integer;--> statement-breakpoint
ALTER TABLE `events` ADD `folder_id` integer REFERENCES image_folders(id);