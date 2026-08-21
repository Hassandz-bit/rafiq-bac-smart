CREATE TABLE `release_quality_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checkKey` enum('academic_batch_qa','real_account_qa','operational_qa','published_bac_session') NOT NULL,
	`evidenceNoteAr` text NOT NULL,
	`actorUserId` int NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `release_quality_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `release_quality_checks` ADD CONSTRAINT `release_quality_checks_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `release_quality_checks_key_recorded_index` ON `release_quality_checks` (`checkKey`,`recordedAt`);