ALTER TABLE `sources` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `sources` ADD `archivedAt` timestamp NULL;--> statement-breakpoint
ALTER TABLE `sources` ADD `archivedByUserId` int;--> statement-breakpoint
ALTER TABLE `sources` ADD CONSTRAINT `sources_archivedByUserId_users_id_fk` FOREIGN KEY (`archivedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `sources_archived_index` ON `sources` (`archivedAt`);
