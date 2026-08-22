ALTER TABLE `partner_referrals` ADD CONSTRAINT `partner_referral_visitor_token_unique` UNIQUE(`visitorTokenHash`);--> statement-breakpoint
ALTER TABLE `partner_referrals` ADD CONSTRAINT `partner_referral_user_unique` UNIQUE(`userId`);
CREATE UNIQUE INDEX `partner_referral_visitor_token_unique` ON `partner_referrals` (`visitorTokenHash`);
