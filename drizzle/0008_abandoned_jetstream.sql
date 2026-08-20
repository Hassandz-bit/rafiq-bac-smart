CREATE TABLE `student_plan_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`productTier` varchar(40) NOT NULL,
	`selectedSubjects` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `student_plan_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `student_plan_assignments` ADD CONSTRAINT `student_plan_assignments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_plan_assignments` ADD CONSTRAINT `student_plan_assignments_planId_plans_id_fk` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `student_plan_assignment_user_tier_index` ON `student_plan_assignments` (`userId`,`productTier`,`isActive`);