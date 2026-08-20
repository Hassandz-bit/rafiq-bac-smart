CREATE TABLE `hassem_final_memory_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`memoryKey` varchar(40) NOT NULL,
	`titleAr` varchar(160) NOT NULL,
	`promptAr` text NOT NULL,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hassem_final_memory_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `hassem_final_memory_user_key_unique` UNIQUE(`userId`,`memoryKey`)
);
--> statement-breakpoint
ALTER TABLE `hassem_final_memory_items` ADD CONSTRAINT `hassem_final_memory_items_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;