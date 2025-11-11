-- ============================================
-- Add shop_name column to tbl_ecom_orders
-- ============================================
-- This migration adds shop_name column to track which Shopify shop each order belongs to
-- Run this in MySQL to add the column

USE dsnew03;

-- Add shop_name column to tbl_ecom_orders
ALTER TABLE `tbl_ecom_orders` 
ADD COLUMN `shop_name` VARCHAR(255) NULL DEFAULT NULL 
AFTER `is_unprocessed`;

-- Add index for faster queries by shop name
ALTER TABLE `tbl_ecom_orders` 
ADD INDEX `idx_shop_name` (`shop_name`);

-- Verify column was added
DESCRIBE `tbl_ecom_orders`;

-- Show sample data (if any orders exist)
SELECT id, ref_number, orderid, shop_name, channel, created_at 
FROM `tbl_ecom_orders` 
WHERE channel = 'shopify' 
ORDER BY id DESC 
LIMIT 5;

