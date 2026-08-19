CREATE TABLE `bac_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subjectId` int NOT NULL,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`submittedAt` timestamp,
	`elapsedSeconds` int NOT NULL DEFAULT 0,
	`score` decimal(5,2),
	`status` enum('in_progress','submitted','analyzed') NOT NULL DEFAULT 'in_progress',
	CONSTRAINT `bac_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `concept_prerequisites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conceptId` int NOT NULL,
	`prerequisiteConceptId` int NOT NULL,
	CONSTRAINT `concept_prerequisites_id` PRIMARY KEY(`id`),
	CONSTRAINT `concept_prerequisite_unique` UNIQUE(`conceptId`,`prerequisiteConceptId`)
);
--> statement-breakpoint
CREATE TABLE `concepts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectId` int NOT NULL,
	`nameAr` varchar(220) NOT NULL,
	`descriptionAr` text,
	`workflowState` enum('draft','in_review','approved','published','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `concepts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileKey` varchar(600) NOT NULL,
	`fileUrl` varchar(1200) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`altTextAr` text,
	`annotationData` json,
	`uploadedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_assets_fileKey_unique` UNIQUE(`fileKey`)
);
--> statement-breakpoint
CREATE TABLE `content_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learningItemId` int,
	`exerciseId` int,
	`mindMapId` int,
	`decision` enum('approved','changes_requested','rejected') NOT NULL,
	`noteAr` text,
	`reviewerUserId` int NOT NULL,
	`reviewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `curriculum_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(80) NOT NULL,
	`academicYear` varchar(20) NOT NULL,
	`level` varchar(120) NOT NULL,
	`track` varchar(120) NOT NULL,
	`title` varchar(220) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`archivedAt` timestamp,
	CONSTRAINT `curriculum_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `curriculum_versions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `error_notebook_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exerciseId` int,
	`conceptId` int,
	`errorType` varchar(80) NOT NULL,
	`explanationAr` text,
	`occurrences` int NOT NULL DEFAULT 1,
	`lastOccurredAt` timestamp NOT NULL DEFAULT (now()),
	`nextReviewAt` timestamp,
	CONSTRAINT `error_notebook_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exercise_hints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exerciseId` int NOT NULL,
	`ordinal` int NOT NULL,
	`body` json NOT NULL,
	CONSTRAINT `exercise_hints_id` PRIMARY KEY(`id`),
	CONSTRAINT `exercise_hint_unique` UNIQUE(`exerciseId`,`ordinal`)
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`sourceId` int,
	`type` enum('mcq','multi_select','true_false','fill','matching','ordering','numeric','math_expression','short_answer','multi_step','document_analysis','interactive_image') NOT NULL,
	`prompt` json NOT NULL,
	`answerDefinition` json NOT NULL,
	`solution` json,
	`difficulty` int NOT NULL DEFAULT 1,
	`questionOrigin` enum('official_bac','original_bac_style') NOT NULL DEFAULT 'original_bac_style',
	`workflowState` enum('draft','in_review','approved','published','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`sourceId` int,
	`type` varchar(60) NOT NULL,
	`titleAr` varchar(240) NOT NULL,
	`body` json NOT NULL,
	`workflowState` enum('draft','in_review','approved','published','archived') NOT NULL DEFAULT 'draft',
	`authoredByUserId` int,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_concepts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`conceptId` int NOT NULL,
	CONSTRAINT `lesson_concepts_id` PRIMARY KEY(`id`),
	CONSTRAINT `lesson_concept_unique` UNIQUE(`lessonId`,`conceptId`)
);
--> statement-breakpoint
CREATE TABLE `lesson_skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`skillId` int NOT NULL,
	CONSTRAINT `lesson_skills_id` PRIMARY KEY(`id`),
	CONSTRAINT `lesson_skill_unique` UNIQUE(`lessonId`,`skillId`)
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitId` int NOT NULL,
	`titleAr` varchar(220) NOT NULL,
	`objectiveAr` text,
	`estimatedMinutes` int,
	`sortOrder` int NOT NULL DEFAULT 0,
	`workflowState` enum('draft','in_review','approved','published','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mastery_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conceptId` int NOT NULL,
	`status` enum('start','understand','practice','near_mastery','mastered') NOT NULL DEFAULT 'start',
	`score` decimal(5,2) NOT NULL DEFAULT '0',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mastery_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `mastery_user_concept_unique` UNIQUE(`userId`,`conceptId`)
);
--> statement-breakpoint
CREATE TABLE `mind_map_edges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mindMapId` int NOT NULL,
	`sourceNodeId` int NOT NULL,
	`targetNodeId` int NOT NULL,
	`labelAr` varchar(220),
	CONSTRAINT `mind_map_edges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mind_map_nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mindMapId` int NOT NULL,
	`nodeType` varchar(40) NOT NULL,
	`labelAr` varchar(500) NOT NULL,
	`content` json,
	`positionX` decimal(12,2) NOT NULL,
	`positionY` decimal(12,2) NOT NULL,
	`collapsed` boolean NOT NULL DEFAULT false,
	CONSTRAINT `mind_map_nodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mind_maps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`sourceId` int,
	`titleAr` varchar(240) NOT NULL,
	`viewport` json,
	`workflowState` enum('draft','in_review','approved','published','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mind_maps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `official_book_uploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectId` int NOT NULL,
	`sourceId` int,
	`fileKey` varchar(600) NOT NULL,
	`fileUrl` varchar(1200) NOT NULL,
	`originalFilename` varchar(500) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`verificationChecklist` json,
	`verificationStatus` enum('current_official','official_but_version_unconfirmed','historical_official','unverified') NOT NULL DEFAULT 'unverified',
	`uploadedByUserId` int NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	CONSTRAINT `official_book_uploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plan_entitlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`entitlement` varchar(100) NOT NULL,
	CONSTRAINT `plan_entitlements_id` PRIMARY KEY(`id`),
	CONSTRAINT `plan_entitlement_unique` UNIQUE(`planId`,`entitlement`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(80) NOT NULL,
	`nameAr` varchar(160) NOT NULL,
	`priceDzd` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `plans_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `review_queue_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conceptId` int,
	`exerciseId` int,
	`reason` varchar(80) NOT NULL,
	`dueAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `review_queue_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectId` int NOT NULL,
	`nameAr` varchar(220) NOT NULL,
	`descriptionAr` text,
	`workflowState` enum('draft','in_review','approved','published','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceAuthority` varchar(180) NOT NULL,
	`url` varchar(1000) NOT NULL,
	`documentTitle` varchar(500) NOT NULL,
	`publicationDate` timestamp,
	`academicYear` varchar(20),
	`level` varchar(120),
	`track` varchar(120),
	`subjectId` int,
	`edition` varchar(120),
	`sourceVersion` varchar(120),
	`verificationStatus` enum('current_official','official_but_version_unconfirmed','historical_official','unverified') NOT NULL DEFAULT 'unverified',
	`verificationDate` timestamp,
	`verificationNotes` text,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`answerPayload` json NOT NULL,
	`isCorrect` boolean NOT NULL,
	`hintsUsed` int NOT NULL DEFAULT 0,
	`durationSeconds` int NOT NULL DEFAULT 0,
	`errorType` varchar(80),
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_entitlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entitlement` varchar(100) NOT NULL,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `student_entitlements_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_entitlement_unique` UNIQUE(`userId`,`entitlement`)
);
--> statement-breakpoint
CREATE TABLE `subject_source_gates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectId` int NOT NULL,
	`status` enum('verified','not_found','requires_user_upload','waiting_for_current_official_book') NOT NULL DEFAULT 'requires_user_upload',
	`noteAr` text,
	`verifiedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subject_source_gates_id` PRIMARY KEY(`id`),
	CONSTRAINT `subject_source_gate_unique` UNIQUE(`subjectId`)
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`curriculumVersionId` int NOT NULL,
	`code` varchar(40) NOT NULL,
	`nameAr` varchar(120) NOT NULL,
	`taglineAr` varchar(240),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isVisible` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `subjects_version_subject_unique` UNIQUE(`curriculumVersionId`,`code`)
);
--> statement-breakpoint
CREATE TABLE `units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectId` int NOT NULL,
	`titleAr` varchar(220) NOT NULL,
	`summaryAr` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`workflowState` enum('draft','in_review','approved','published','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `units_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','content_editor','academic_reviewer','student') NOT NULL DEFAULT 'student';--> statement-breakpoint
ALTER TABLE `bac_sessions` ADD CONSTRAINT `bac_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bac_sessions` ADD CONSTRAINT `bac_sessions_subjectId_subjects_id_fk` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `concept_prerequisites` ADD CONSTRAINT `concept_prerequisites_conceptId_concepts_id_fk` FOREIGN KEY (`conceptId`) REFERENCES `concepts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `concept_prerequisites` ADD CONSTRAINT `concept_prerequisites_prerequisiteConceptId_concepts_id_fk` FOREIGN KEY (`prerequisiteConceptId`) REFERENCES `concepts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `concepts` ADD CONSTRAINT `concepts_subjectId_subjects_id_fk` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_assets` ADD CONSTRAINT `content_assets_uploadedByUserId_users_id_fk` FOREIGN KEY (`uploadedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_reviews` ADD CONSTRAINT `content_reviews_learningItemId_learning_items_id_fk` FOREIGN KEY (`learningItemId`) REFERENCES `learning_items`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_reviews` ADD CONSTRAINT `content_reviews_exerciseId_exercises_id_fk` FOREIGN KEY (`exerciseId`) REFERENCES `exercises`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_reviews` ADD CONSTRAINT `content_reviews_mindMapId_mind_maps_id_fk` FOREIGN KEY (`mindMapId`) REFERENCES `mind_maps`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_reviews` ADD CONSTRAINT `content_reviews_reviewerUserId_users_id_fk` FOREIGN KEY (`reviewerUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `error_notebook_entries` ADD CONSTRAINT `error_notebook_entries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `error_notebook_entries` ADD CONSTRAINT `error_notebook_entries_exerciseId_exercises_id_fk` FOREIGN KEY (`exerciseId`) REFERENCES `exercises`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `error_notebook_entries` ADD CONSTRAINT `error_notebook_entries_conceptId_concepts_id_fk` FOREIGN KEY (`conceptId`) REFERENCES `concepts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exercise_hints` ADD CONSTRAINT `exercise_hints_exerciseId_exercises_id_fk` FOREIGN KEY (`exerciseId`) REFERENCES `exercises`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exercises` ADD CONSTRAINT `exercises_lessonId_lessons_id_fk` FOREIGN KEY (`lessonId`) REFERENCES `lessons`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exercises` ADD CONSTRAINT `exercises_sourceId_sources_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `sources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learning_items` ADD CONSTRAINT `learning_items_lessonId_lessons_id_fk` FOREIGN KEY (`lessonId`) REFERENCES `lessons`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learning_items` ADD CONSTRAINT `learning_items_sourceId_sources_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `sources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learning_items` ADD CONSTRAINT `learning_items_authoredByUserId_users_id_fk` FOREIGN KEY (`authoredByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lesson_concepts` ADD CONSTRAINT `lesson_concepts_lessonId_lessons_id_fk` FOREIGN KEY (`lessonId`) REFERENCES `lessons`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lesson_concepts` ADD CONSTRAINT `lesson_concepts_conceptId_concepts_id_fk` FOREIGN KEY (`conceptId`) REFERENCES `concepts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lesson_skills` ADD CONSTRAINT `lesson_skills_lessonId_lessons_id_fk` FOREIGN KEY (`lessonId`) REFERENCES `lessons`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lesson_skills` ADD CONSTRAINT `lesson_skills_skillId_skills_id_fk` FOREIGN KEY (`skillId`) REFERENCES `skills`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_unitId_units_id_fk` FOREIGN KEY (`unitId`) REFERENCES `units`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mastery_records` ADD CONSTRAINT `mastery_records_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mastery_records` ADD CONSTRAINT `mastery_records_conceptId_concepts_id_fk` FOREIGN KEY (`conceptId`) REFERENCES `concepts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mind_map_edges` ADD CONSTRAINT `mind_map_edges_mindMapId_mind_maps_id_fk` FOREIGN KEY (`mindMapId`) REFERENCES `mind_maps`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mind_map_edges` ADD CONSTRAINT `mind_map_edges_sourceNodeId_mind_map_nodes_id_fk` FOREIGN KEY (`sourceNodeId`) REFERENCES `mind_map_nodes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mind_map_edges` ADD CONSTRAINT `mind_map_edges_targetNodeId_mind_map_nodes_id_fk` FOREIGN KEY (`targetNodeId`) REFERENCES `mind_map_nodes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mind_map_nodes` ADD CONSTRAINT `mind_map_nodes_mindMapId_mind_maps_id_fk` FOREIGN KEY (`mindMapId`) REFERENCES `mind_maps`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mind_maps` ADD CONSTRAINT `mind_maps_lessonId_lessons_id_fk` FOREIGN KEY (`lessonId`) REFERENCES `lessons`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mind_maps` ADD CONSTRAINT `mind_maps_sourceId_sources_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `sources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `official_book_uploads` ADD CONSTRAINT `official_book_uploads_subjectId_subjects_id_fk` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `official_book_uploads` ADD CONSTRAINT `official_book_uploads_sourceId_sources_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `sources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `official_book_uploads` ADD CONSTRAINT `official_book_uploads_uploadedByUserId_users_id_fk` FOREIGN KEY (`uploadedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `official_book_uploads` ADD CONSTRAINT `official_book_uploads_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_entitlements` ADD CONSTRAINT `plan_entitlements_planId_plans_id_fk` FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_queue_items` ADD CONSTRAINT `review_queue_items_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_queue_items` ADD CONSTRAINT `review_queue_items_conceptId_concepts_id_fk` FOREIGN KEY (`conceptId`) REFERENCES `concepts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `review_queue_items` ADD CONSTRAINT `review_queue_items_exerciseId_exercises_id_fk` FOREIGN KEY (`exerciseId`) REFERENCES `exercises`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skills` ADD CONSTRAINT `skills_subjectId_subjects_id_fk` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sources` ADD CONSTRAINT `sources_subjectId_subjects_id_fk` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sources` ADD CONSTRAINT `sources_createdByUserId_users_id_fk` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_attempts` ADD CONSTRAINT `student_attempts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_attempts` ADD CONSTRAINT `student_attempts_exerciseId_exercises_id_fk` FOREIGN KEY (`exerciseId`) REFERENCES `exercises`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_entitlements` ADD CONSTRAINT `student_entitlements_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subject_source_gates` ADD CONSTRAINT `subject_source_gates_subjectId_subjects_id_fk` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subjects` ADD CONSTRAINT `subjects_curriculumVersionId_curriculum_versions_id_fk` FOREIGN KEY (`curriculumVersionId`) REFERENCES `curriculum_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `units` ADD CONSTRAINT `units_subjectId_subjects_id_fk` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `concepts_subject_index` ON `concepts` (`subjectId`);--> statement-breakpoint
CREATE INDEX `content_reviews_reviewer_index` ON `content_reviews` (`reviewerUserId`);--> statement-breakpoint
CREATE INDEX `error_notebook_user_index` ON `error_notebook_entries` (`userId`);--> statement-breakpoint
CREATE INDEX `exercises_lesson_index` ON `exercises` (`lessonId`);--> statement-breakpoint
CREATE INDEX `learning_items_lesson_index` ON `learning_items` (`lessonId`);--> statement-breakpoint
CREATE INDEX `learning_items_workflow_index` ON `learning_items` (`workflowState`);--> statement-breakpoint
CREATE INDEX `lessons_unit_index` ON `lessons` (`unitId`);--> statement-breakpoint
CREATE INDEX `mind_map_edges_map_index` ON `mind_map_edges` (`mindMapId`);--> statement-breakpoint
CREATE INDEX `mind_map_nodes_map_index` ON `mind_map_nodes` (`mindMapId`);--> statement-breakpoint
CREATE INDEX `official_book_upload_subject_index` ON `official_book_uploads` (`subjectId`);--> statement-breakpoint
CREATE INDEX `review_queue_user_due_index` ON `review_queue_items` (`userId`,`dueAt`);--> statement-breakpoint
CREATE INDEX `skills_subject_index` ON `skills` (`subjectId`);--> statement-breakpoint
CREATE INDEX `sources_subject_index` ON `sources` (`subjectId`);--> statement-breakpoint
CREATE INDEX `sources_status_index` ON `sources` (`verificationStatus`);--> statement-breakpoint
CREATE INDEX `student_attempt_user_exercise_index` ON `student_attempts` (`userId`,`exerciseId`);--> statement-breakpoint
CREATE INDEX `units_subject_index` ON `units` (`subjectId`);