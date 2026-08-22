CREATE TABLE `partner_operating_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`verificationDays` int NOT NULL DEFAULT 7,
	`minimumPayoutDzd` int NOT NULL DEFAULT 2000,
	`payoutMethods` json NOT NULL,
	`updatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pos_pk` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `partner_operating_settings` ADD CONSTRAINT `pos_user_fk` FOREIGN KEY (`updatedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
INSERT INTO `partner_operating_settings` (`verificationDays`, `minimumPayoutDzd`, `payoutMethods`) VALUES (7, 2000, JSON_ARRAY('ccp', 'baridimob', 'bank_transfer', 'other'));
