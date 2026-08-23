CREATE TABLE `push_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`endpointHash` varchar(64) NOT NULL,
	`subscriptionCiphertext` text NOT NULL,
	`subscriptionIv` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastUsedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `push_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `push_subscription_endpoint_unique` UNIQUE(`endpointHash`)
);
--> statement-breakpoint
CREATE TABLE `push_vapid_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicKey` varchar(256) NOT NULL,
	`privateKeyCiphertext` text NOT NULL,
	`privateKeyIv` varchar(64) NOT NULL,
	`subject` varchar(320) NOT NULL,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `push_vapid_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `push_subscriptions` ADD CONSTRAINT `push_subscriptions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `push_vapid_settings` ADD CONSTRAINT `push_vapid_settings_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `push_subscription_user_updated_index` ON `push_subscriptions` (`userId`,`updatedAt`);