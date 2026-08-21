CREATE TABLE `plan_change_audits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`previousPlanId` int,
	`nextPlanId` int NOT NULL,
	`changeKind` enum('manual_assignment','upgrade','promotion') NOT NULL DEFAULT 'manual_assignment',
	`noteAr` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plan_change_audits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `plan_change_audits` ADD CONSTRAINT `plan_change_audits_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_change_audits` ADD CONSTRAINT `plan_change_audits_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_change_audits` ADD CONSTRAINT `plan_change_audits_previousPlanId_plans_id_fk` FOREIGN KEY (`previousPlanId`) REFERENCES `plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_change_audits` ADD CONSTRAINT `plan_change_audits_nextPlanId_plans_id_fk` FOREIGN KEY (`nextPlanId`) REFERENCES `plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `plan_change_audits_user_created_index` ON `plan_change_audits` (`userId`,`createdAt`);