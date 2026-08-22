CREATE TABLE `partner_credit_balances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`availableCredits` int NOT NULL DEFAULT 0,
	`reservedCredits` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pcb_pk` PRIMARY KEY(`id`),
	CONSTRAINT `pcb_partner_uq` UNIQUE(`partnerId`)
);
--> statement-breakpoint
CREATE TABLE `partner_credit_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT false,
	`updatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pcs_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `partner_credit_balances` ADD CONSTRAINT `pcb_partner_fk` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `partner_credit_settings` ADD CONSTRAINT `pcs_user_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
INSERT INTO `partner_credit_settings` (`isEnabled`) VALUES (false);
