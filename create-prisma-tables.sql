-- Create Prisma tables in dsnew03 database
-- This script only creates the 4 tables needed for Shopify app
-- It will NOT affect your existing tables

USE dsnew03;

-- Create Session table (for Shopify OAuth sessions)
-- Using IF NOT EXISTS to safely create without errors if table already exists
CREATE TABLE IF NOT EXISTS `Session` (
  `id` VARCHAR(191) NOT NULL,
  `shop` VARCHAR(191) NOT NULL,
  `state` VARCHAR(191) NOT NULL,
  `isOnline` BOOLEAN NOT NULL DEFAULT false,
  `scope` VARCHAR(191) NULL,
  `expires` DATETIME(3) NULL,
  `accessToken` VARCHAR(191) NOT NULL,
  `userId` BIGINT NULL,
  `firstName` VARCHAR(191) NULL,
  `lastName` VARCHAR(191) NULL,
  `email` VARCHAR(191) NULL,
  `accountOwner` BOOLEAN NOT NULL DEFAULT false,
  `locale` VARCHAR(191) NULL,
  `collaborator` BOOLEAN NULL,
  `emailVerified` BOOLEAN NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create OrderEvent table (for webhook events)
-- Using IF NOT EXISTS to safely create without errors if table already exists
CREATE TABLE IF NOT EXISTS `OrderEvent` (
  `id` VARCHAR(191) NOT NULL,
  `shop` VARCHAR(191) NOT NULL,
  `topic` VARCHAR(191) NOT NULL,
  `orderId` BIGINT NULL,
  `payload` JSON NOT NULL,
  `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `OrderEvent_shop_topic_idx` (`shop`, `topic`),
  INDEX `OrderEvent_orderId_idx` (`orderId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create User table (for app users)
-- Using IF NOT EXISTS to safely create without errors if table already exists
CREATE TABLE IF NOT EXISTS `User` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(191) NULL,
  `shop` VARCHAR(191) NOT NULL,
  `accessToken` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create WebhookConfig table (for webhook secrets)
-- Using IF NOT EXISTS to safely create without errors if table already exists
CREATE TABLE IF NOT EXISTS `WebhookConfig` (
  `id` VARCHAR(191) NOT NULL,
  `shop` VARCHAR(191) NOT NULL,
  `webhookSecret` VARCHAR(191) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `WebhookConfig_shop_key` (`shop`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verify tables created
SELECT 'Tables created successfully!' AS Status;
SHOW TABLES LIKE 'Session';
SHOW TABLES LIKE 'OrderEvent';
SHOW TABLES LIKE 'User';
SHOW TABLES LIKE 'WebhookConfig';

