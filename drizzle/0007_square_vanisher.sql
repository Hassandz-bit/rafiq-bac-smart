CREATE TABLE `learning_item_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learningItemId` int NOT NULL,
	`assetId` int NOT NULL,
	`sourceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_item_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `learning_item_asset_unique` UNIQUE(`learningItemId`,`assetId`)
);
--> statement-breakpoint
ALTER TABLE `learning_item_assets` ADD CONSTRAINT `learning_item_assets_learningItemId_learning_items_id_fk` FOREIGN KEY (`learningItemId`) REFERENCES `learning_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learning_item_assets` ADD CONSTRAINT `learning_item_assets_assetId_content_assets_id_fk` FOREIGN KEY (`assetId`) REFERENCES `content_assets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learning_item_assets` ADD CONSTRAINT `learning_item_assets_sourceId_sources_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `sources`(`id`) ON DELETE no action ON UPDATE no action;