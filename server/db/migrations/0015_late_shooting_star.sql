CREATE TABLE `folder_access_emails` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`folder_id` integer NOT NULL,
	`email` text NOT NULL,
	`accessed_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`folder_id`) REFERENCES `image_folders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `galleries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`folder_id` integer NOT NULL,
	`client_name` text,
	`shoot_date` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`folder_id`) REFERENCES `image_folders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `image_folders` ADD `is_private_link` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `image_folders` ADD `private_link_token` text;--> statement-breakpoint
ALTER TABLE `image_folders` ADD `access_code` text;--> statement-breakpoint
ALTER TABLE `image_folders` ADD `require_email` integer DEFAULT false NOT NULL;