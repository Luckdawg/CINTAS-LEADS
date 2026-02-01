CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`companyName` varchar(500) NOT NULL,
	`address` text NOT NULL,
	`county` varchar(100) NOT NULL,
	`city` varchar(100),
	`state` varchar(2) NOT NULL DEFAULT 'GA',
	`zipCode` varchar(10),
	`phone` varchar(50),
	`website` varchar(500),
	`industry` varchar(200),
	`safetyVertical` enum('FirstAidSafety','FireProtection','Both') NOT NULL,
	`employeeCountEstimated` int,
	`employeeEstimateConfidence` enum('High','Medium','Low'),
	`revenueEstimate` decimal(15,2),
	`linkedInCompanyUrl` varchar(500),
	`linkedInEmployeeSize` varchar(50),
	`googleMapsPlaceId` varchar(200),
	`googleMapsUrl` varchar(500),
	`googleMapsRating` decimal(3,2),
	`googleMapsReviewCount` int,
	`possibleDuplicate` boolean NOT NULL DEFAULT false,
	`duplicateGroupId` varchar(36),
	`dataSource` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `accounts_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`contactName` varchar(200) NOT NULL,
	`title` varchar(200),
	`roleType` enum('Primary','Secondary') NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`linkedInUrl` varchar(500),
	`safetyDecisionAuthority` int NOT NULL DEFAULT 0,
	`dataSource` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `duplicateAnalysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`duplicateGroupId` varchar(36) NOT NULL,
	`accountIdA` int NOT NULL,
	`accountIdB` int NOT NULL,
	`nameSimilarityScore` decimal(5,2),
	`addressSimilarityScore` decimal(5,2),
	`overallSimilarityScore` decimal(5,2),
	`matchReason` text,
	`matchedFields` varchar(500),
	`analyzedAt` timestamp NOT NULL DEFAULT (now()),
	`algorithmVersion` varchar(20) NOT NULL DEFAULT '1.0',
	CONSTRAINT `duplicateAnalysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sourceMetadata` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`sourceName` varchar(100) NOT NULL,
	`sourceUrl` text,
	`collectionMethod` varchar(100),
	`collectedAt` timestamp NOT NULL DEFAULT (now()),
	`queryUsed` text,
	`rawData` text,
	`dataQualityScore` int,
	`fieldsPopulated` int,
	`totalFields` int,
	CONSTRAINT `sourceMetadata_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `county_idx` ON `accounts` (`county`);--> statement-breakpoint
CREATE INDEX `safety_vertical_idx` ON `accounts` (`safetyVertical`);--> statement-breakpoint
CREATE INDEX `duplicate_group_idx` ON `accounts` (`duplicateGroupId`);--> statement-breakpoint
CREATE INDEX `account_idx` ON `contacts` (`accountId`);--> statement-breakpoint
CREATE INDEX `dup_group_idx` ON `duplicateAnalysis` (`duplicateGroupId`);--> statement-breakpoint
CREATE INDEX `dup_account_a_idx` ON `duplicateAnalysis` (`accountIdA`);--> statement-breakpoint
CREATE INDEX `dup_account_b_idx` ON `duplicateAnalysis` (`accountIdB`);--> statement-breakpoint
CREATE INDEX `source_account_idx` ON `sourceMetadata` (`accountId`);--> statement-breakpoint
CREATE INDEX `source_name_idx` ON `sourceMetadata` (`sourceName`);