CREATE TABLE `skill_dependencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`skillId` int NOT NULL,
	`dependsOnSkillId` int NOT NULL,
	CONSTRAINT `skill_dependencies_id` PRIMARY KEY(`id`),
	CONSTRAINT `skill_dependency_unique` UNIQUE(`skillId`,`dependsOnSkillId`)
);
--> statement-breakpoint
ALTER TABLE `skill_dependencies` ADD CONSTRAINT `skill_dependencies_skillId_skills_id_fk` FOREIGN KEY (`skillId`) REFERENCES `skills`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill_dependencies` ADD CONSTRAINT `skill_dependencies_dependsOnSkillId_skills_id_fk` FOREIGN KEY (`dependsOnSkillId`) REFERENCES `skills`(`id`) ON DELETE no action ON UPDATE no action;