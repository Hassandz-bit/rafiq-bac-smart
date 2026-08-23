CREATE TABLE `partner_credit_ledger_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`entryType` enum('credit','debit') NOT NULL,
	`amount` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`idempotencyKey` varchar(120) NOT NULL,
	`reasonAr` text NOT NULL,
	`actorUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_credit_ledger_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `partner_credit_ledger_idempotency_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
ALTER TABLE `partner_credit_ledger_entries` ADD CONSTRAINT `pcl_partner_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_credit_ledger_entries` ADD CONSTRAINT `pcl_actor_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `partner_credit_ledger_partner_created_index` ON `partner_credit_ledger_entries` (`partnerId`,`createdAt`);
