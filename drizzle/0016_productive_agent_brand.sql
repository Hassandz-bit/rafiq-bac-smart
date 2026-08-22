CREATE TABLE `partner_agreements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`agreementDate` timestamp NOT NULL,
	`commissionPolicy` enum('marginal_tier','retroactive_tier') NOT NULL DEFAULT 'marginal_tier',
	`startDate` timestamp,
	`endDate` timestamp,
	`status` varchar(48) NOT NULL DEFAULT 'draft',
	`documentReference` varchar(1200),
	`approvedByUserId` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_agreements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partner_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerType` enum('support_school','distribution_office') NOT NULL,
	`institutionName` varchar(240) NOT NULL,
	`tradeName` varchar(240),
	`contactName` varchar(180) NOT NULL,
	`contactPosition` varchar(160),
	`phone` varchar(48) NOT NULL,
	`whatsapp` varchar(48),
	`email` varchar(320),
	`wilaya` varchar(120) NOT NULL,
	`commune` varchar(160) NOT NULL,
	`address` text NOT NULL,
	`latitude` decimal(10,7) NOT NULL,
	`longitude` decimal(10,7) NOT NULL,
	`websiteUrl` varchar(1000),
	`facebookUrl` varchar(1000),
	`notes` text,
	`expectedStudentReach` int NOT NULL DEFAULT 0,
	`discoverySource` varchar(240),
	`status` enum('pending','under_review','approved','rejected','needs_information','cancelled') NOT NULL DEFAULT 'pending',
	`reviewNoteAr` text,
	`internalNoteAr` text,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partner_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partner_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int,
	`category` varchar(80) NOT NULL,
	`titleAr` varchar(240) NOT NULL,
	`shareCopyAr` text,
	`fileKey` varchar(600),
	`fileUrl` varchar(1200),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partner_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int,
	`actorUserId` int,
	`action` varchar(120) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` int,
	`previousData` json,
	`nextData` json,
	`noteAr` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partner_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int,
	`campaignCode` varchar(80) NOT NULL,
	`startDate` timestamp,
	`endDate` timestamp,
	`commissionOverrideRate` decimal(5,2),
	`promoCode` varchar(80),
	`status` varchar(48) NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_campaigns_id` PRIMARY KEY(`id`),
	CONSTRAINT `partner_campaigns_campaignCode_unique` UNIQUE(`campaignCode`)
);
--> statement-breakpoint
CREATE TABLE `partner_commission_tiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerType` enum('support_school','distribution_office') NOT NULL,
	`fromEligibleCount` int NOT NULL,
	`toEligibleCount` int,
	`commissionRate` decimal(5,2) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partner_commission_tiers_id` PRIMARY KEY(`id`),
	CONSTRAINT `partner_commission_tier_type_from_unique` UNIQUE(`partnerType`,`fromEligibleCount`)
);
--> statement-breakpoint
CREATE TABLE `partner_commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`referralId` int NOT NULL,
	`studentUserId` int NOT NULL,
	`studentPlanAssignmentId` int,
	`orderReference` varchar(160),
	`grossAmountDzd` int NOT NULL,
	`commissionRate` decimal(5,2) NOT NULL,
	`commissionAmountDzd` int NOT NULL,
	`tierId` int NOT NULL,
	`status` enum('pending','approved','paid','cancelled','reversed') NOT NULL DEFAULT 'pending',
	`eligibleAt` timestamp NOT NULL DEFAULT (now()),
	`approvedAt` timestamp,
	`approvedByUserId` int,
	`reversedAt` timestamp,
	`reversedByUserId` int,
	`reversalReasonAr` text,
	`notesAr` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_commissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `partner_commission_assignment_unique` UNIQUE(`studentPlanAssignmentId`)
);
--> statement-breakpoint
CREATE TABLE `partner_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`category` varchar(80) NOT NULL,
	`fileKey` varchar(600) NOT NULL,
	`fileUrl` varchar(1200) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`uploadedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partner_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`institutionName` varchar(240) NOT NULL,
	`partnerType` enum('support_school','distribution_office') NOT NULL,
	`wilaya` varchar(120) NOT NULL,
	`commune` varchar(160),
	`contactName` varchar(180),
	`phone` varchar(48),
	`source` varchar(160),
	`status` varchar(48) NOT NULL DEFAULT 'lead',
	`notesAr` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partner_leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partner_payout_allocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`payoutRequestId` int NOT NULL,
	`commissionId` int NOT NULL,
	`allocatedAmountDzd` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partner_payout_allocations_id` PRIMARY KEY(`id`),
	CONSTRAINT `partner_payout_allocation_commission_unique` UNIQUE(`commissionId`)
);
--> statement-breakpoint
CREATE TABLE `partner_payout_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`amountDzd` int NOT NULL,
	`payoutMethod` enum('ccp','baridimob','bank_transfer','other') NOT NULL,
	`paymentDetailsCiphertext` text NOT NULL,
	`paymentDetailsIv` varchar(64) NOT NULL,
	`destinationMasked` varchar(180) NOT NULL,
	`status` enum('requested','under_review','approved','paid','rejected') NOT NULL DEFAULT 'requested',
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`reviewedByUserId` int,
	`paidAt` timestamp,
	`paidByUserId` int,
	`paymentReference` varchar(240),
	`reviewNoteAr` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partner_payout_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partner_referral_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`code` varchar(80) NOT NULL,
	`campaignCode` varchar(80),
	`landingPage` varchar(500) NOT NULL DEFAULT '/',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`deactivatedAt` timestamp,
	CONSTRAINT `partner_referral_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `partner_referral_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `partner_referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`referralCodeId` int,
	`referralCode` varchar(80) NOT NULL,
	`userId` int,
	`visitorTokenHash` varchar(128),
	`campaignCode` varchar(80),
	`landingPage` varchar(500),
	`status` enum('captured','registered','eligible','converted','invalid','reversed') NOT NULL DEFAULT 'captured',
	`firstSeenAt` timestamp NOT NULL DEFAULT (now()),
	`registeredAt` timestamp,
	`eligibleAt` timestamp,
	`convertedAt` timestamp,
	`lockedAt` timestamp,
	`invalidReasonAr` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partner_referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int,
	`userId` int,
	`partnerType` enum('support_school','distribution_office') NOT NULL,
	`status` enum('pending_review','active','suspended','inactive','rejected') NOT NULL DEFAULT 'pending_review',
	`institutionName` varchar(240) NOT NULL,
	`tradeName` varchar(240),
	`contactName` varchar(180) NOT NULL,
	`contactPosition` varchar(160),
	`phone` varchar(48) NOT NULL,
	`whatsapp` varchar(48),
	`email` varchar(320),
	`wilaya` varchar(120) NOT NULL,
	`commune` varchar(160) NOT NULL,
	`address` text NOT NULL,
	`latitude` decimal(10,7) NOT NULL,
	`longitude` decimal(10,7) NOT NULL,
	`websiteUrl` varchar(1000),
	`facebookUrl` varchar(1000),
	`partnerCode` varchar(64) NOT NULL,
	`referralUrl` varchar(1000) NOT NULL,
	`referralActive` boolean NOT NULL DEFAULT false,
	`commissionModel` enum('marginal_tier','retroactive_tier') NOT NULL DEFAULT 'marginal_tier',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`suspendedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partners_id` PRIMARY KEY(`id`),
	CONSTRAINT `partners_partnerCode_unique` UNIQUE(`partnerCode`),
	CONSTRAINT `partner_application_unique` UNIQUE(`applicationId`),
	CONSTRAINT `partner_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','content_editor','academic_reviewer','student','partner') NOT NULL DEFAULT 'student';--> statement-breakpoint
ALTER TABLE `partner_agreements` ADD CONSTRAINT `fk_pag_partner` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_agreements` ADD CONSTRAINT `fk_pag_approver` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_applications` ADD CONSTRAINT `fk_papp_reviewer` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_assets` ADD CONSTRAINT `fk_pass_partner` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_assets` ADD CONSTRAINT `fk_pass_creator` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_audit_logs` ADD CONSTRAINT `fk_paud_partner` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_audit_logs` ADD CONSTRAINT `fk_paud_actor` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_campaigns` ADD CONSTRAINT `fk_pcam_partner` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_commissions` ADD CONSTRAINT `fk_pcom_partner` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_commissions` ADD CONSTRAINT `fk_pcom_referral` FOREIGN KEY (`referralId`) REFERENCES `partner_referrals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_commissions` ADD CONSTRAINT `fk_pcom_student` FOREIGN KEY (`studentUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_commissions` ADD CONSTRAINT `fk_pcom_assignment` FOREIGN KEY (`studentPlanAssignmentId`) REFERENCES `student_plan_assignments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_commissions` ADD CONSTRAINT `fk_pcom_tier` FOREIGN KEY (`tierId`) REFERENCES `partner_commission_tiers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_commissions` ADD CONSTRAINT `fk_pcom_approver` FOREIGN KEY (`approvedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_commissions` ADD CONSTRAINT `fk_pcom_reverser` FOREIGN KEY (`reversedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_documents` ADD CONSTRAINT `fk_pdoc_partner` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_documents` ADD CONSTRAINT `fk_pdoc_uploader` FOREIGN KEY (`uploadedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_leads` ADD CONSTRAINT `fk_plead_creator` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_payout_allocations` ADD CONSTRAINT `fk_ppal_payout` FOREIGN KEY (`payoutRequestId`) REFERENCES `partner_payout_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_payout_allocations` ADD CONSTRAINT `fk_ppal_commission` FOREIGN KEY (`commissionId`) REFERENCES `partner_commissions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_payout_requests` ADD CONSTRAINT `fk_ppay_partner` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_payout_requests` ADD CONSTRAINT `fk_ppay_reviewer` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_payout_requests` ADD CONSTRAINT `fk_ppay_payer` FOREIGN KEY (`paidByUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_referral_codes` ADD CONSTRAINT `fk_prcode_partner` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_referrals` ADD CONSTRAINT `fk_pref_partner` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_referrals` ADD CONSTRAINT `fk_pref_code` FOREIGN KEY (`referralCodeId`) REFERENCES `partner_referral_codes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partner_referrals` ADD CONSTRAINT `fk_pref_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partners` ADD CONSTRAINT `fk_partner_application` FOREIGN KEY (`applicationId`) REFERENCES `partner_applications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partners` ADD CONSTRAINT `fk_partner_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `partner_agreement_partner_index` ON `partner_agreements` (`partnerId`,`status`);--> statement-breakpoint
CREATE INDEX `partner_application_status_created_index` ON `partner_applications` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `partner_application_area_index` ON `partner_applications` (`wilaya`,`commune`);--> statement-breakpoint
CREATE INDEX `partner_asset_partner_active_index` ON `partner_assets` (`partnerId`,`isActive`);--> statement-breakpoint
CREATE INDEX `partner_audit_partner_created_index` ON `partner_audit_logs` (`partnerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `partner_audit_action_index` ON `partner_audit_logs` (`action`,`createdAt`);--> statement-breakpoint
CREATE INDEX `partner_campaign_partner_status_index` ON `partner_campaigns` (`partnerId`,`status`);--> statement-breakpoint
CREATE INDEX `partner_commission_partner_status_index` ON `partner_commissions` (`partnerId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `partner_document_partner_category_index` ON `partner_documents` (`partnerId`,`category`);--> statement-breakpoint
CREATE INDEX `partner_lead_status_area_index` ON `partner_leads` (`status`,`wilaya`,`commune`);--> statement-breakpoint
CREATE INDEX `partner_payout_partner_status_index` ON `partner_payout_requests` (`partnerId`,`status`,`requestedAt`);--> statement-breakpoint
CREATE INDEX `partner_referral_code_partner_index` ON `partner_referral_codes` (`partnerId`,`isActive`);--> statement-breakpoint
CREATE INDEX `partner_referral_user_index` ON `partner_referrals` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `partner_referral_partner_status_index` ON `partner_referrals` (`partnerId`,`status`);--> statement-breakpoint
CREATE INDEX `partner_status_area_index` ON `partners` (`status`,`wilaya`,`commune`);
