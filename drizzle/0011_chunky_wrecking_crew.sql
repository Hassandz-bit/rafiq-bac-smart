CREATE TABLE `hassem_focus_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionType` varchar(40) NOT NULL,
	`durationMinutes` int NOT NULL,
	`status` varchar(24) NOT NULL DEFAULT 'started',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hassem_focus_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `hassem_focus_sessions` ADD CONSTRAINT `hassem_focus_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `hassem_focus_session_user_status_index` ON `hassem_focus_sessions` (`userId`,`status`,`startedAt`);