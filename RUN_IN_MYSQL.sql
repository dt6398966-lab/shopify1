-- ============================================
-- Prisma Tables SQL - Copy & Paste in MySQL
-- ============================================
-- Run this in MySQL Workbench, phpMyAdmin, or MySQL command line
-- Make sure you're using the dsnew03 database

USE dsnew03;

-- ============================================
-- Table 1: Session (Shopify OAuth sessions)
-- ============================================
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
    `collaborator` BOOLEAN NULL DEFAULT false,
    `emailVerified` BOOLEAN NULL DEFAULT false,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- Table 2: OrderEvent (Webhook events log)
-- ============================================
CREATE TABLE IF NOT EXISTS `OrderEvent` (
    `id` VARCHAR(191) NOT NULL,
    `shop` VARCHAR(191) NOT NULL,
    `topic` VARCHAR(191) NOT NULL,
    `orderId` BIGINT NULL,
    `payload` JSON NOT NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `OrderEvent_shop_topic_idx`(`shop`, `topic`),
    INDEX `OrderEvent_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- Table 3: User (App users)
-- ============================================
CREATE TABLE IF NOT EXISTS `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NULL,
    `shop` VARCHAR(191) NOT NULL,
    `accessToken` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- Table 4: WebhookConfig (Webhook secrets)
-- ============================================
CREATE TABLE IF NOT EXISTS `WebhookConfig` (
    `id` VARCHAR(191) NOT NULL,
    `shop` VARCHAR(191) NOT NULL,
    `webhookSecret` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `WebhookConfig_shop_key`(`shop`),
    INDEX `WebhookConfig_shop_idx`(`shop`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- Verify tables were created
-- ============================================
SELECT '✅ Tables created successfully!' AS Status;
SHOW TABLES LIKE 'Session';
SHOW TABLES LIKE 'OrderEvent';
SHOW TABLES LIKE 'User';
SHOW TABLES LIKE 'WebhookConfig';

