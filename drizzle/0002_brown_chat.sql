DROP INDEX `safety_vertical_idx` ON `accounts`;--> statement-breakpoint
ALTER TABLE `accounts` MODIFY COLUMN `zipCode` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts` ADD `productLines` text;--> statement-breakpoint
CREATE INDEX `zip_code_idx` ON `accounts` (`zipCode`);--> statement-breakpoint
ALTER TABLE `accounts` DROP COLUMN `safetyVertical`;