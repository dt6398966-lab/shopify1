# 📊 All Tables Where Order Data is Stored

## Overview

When a Shopify order is received via webhook, the data is stored in **6 tables** across two database systems:

1. **MySQL Tables** (4 tables) - Main order data
2. **Prisma Tables** (2 tables) - Webhook events and user data

---

## 1️⃣ MySQL Tables (Direct Connection)

### 1. `tbl_ecom_orders`
**Purpose:** Main order header information

**Fields Stored:**
- `channel` - "shopify"
- `ref_number` - Order name (e.g., "#1001")
- `orderid` - Shopify order number
- `invoice_no` - Shopify order number (duplicate)
- `client_id` - 0 (default)
- `payment_mode` - Payment terms
- `collectable_amount` - Total price
- `warehouse_id` - null
- `total_weight` - Total weight in grams
- `weight_unit` - "gm"
- `grand_total` - Total price
- `total_qty` - Total quantity of all items
- `box_qty` - 1 (default)
- `total_tax` - Tax amount
- `total_discount` - Discount amount
- `is_unprocessed` - 1 (default)
- `shop_name` - Shopify shop domain (e.g., "dispatch-solutions.myshopify.com")

**Key Field:** `id` (auto-increment primary key, used to link other tables)

---

### 2. `tbl_ecom_consignee_details`
**Purpose:** Customer shipping and billing address information

**Fields Stored:**
- `order_id` - Links to `tbl_ecom_orders.id`
- `first_name` - Shipping first name
- `last_name` - Shipping last name
- `email` - Customer email
- `phone` - Phone number (with fallback logic)
- `address_line1` - Shipping address line 1
- `address_line2` - Shipping address line 2
- `country` - Shipping country
- `state` - Shipping state/province
- `city` - Shipping city
- `pincode` - Shipping zip/postal code
- `billing_same_as_shipping` - 1 if billing same as shipping, else 0
- `billing_first_name` - Billing first name
- `billing_last_name` - Billing last name
- `billing_email` - Billing email
- `billing_phone` - Billing phone (with fallback)
- `billing_address_line1` - Billing address line 1
- `billing_address_line2` - Billing address line 2
- `billing_country` - Billing country
- `billing_state` - Billing state/province
- `billing_city` - Billing city
- `billing_pincode` - Billing zip/postal code

**Phone Number Fallback Priority:**
1. `shipping_address.phone`
2. `billing_address.phone`
3. `customer.phone`
4. `order.phone`

---

### 3. `tbl_ecom_boxes_details`
**Purpose:** Package/box dimensions and weight information

**Fields Stored:**
- `order_id` - Links to `tbl_ecom_orders.id`
- `package_type` - "box" (default)
- `length` - Box length in cm (calculated or estimated)
- `breadth` - Box width in cm (calculated or estimated)
- `height` - Box height in cm (calculated or estimated)
- `dimension_unit` - "cm"
- `weight` - Total weight in grams
- `weight_unit` - "gm"

**Dimension Calculation:**
- **Real dimensions:** If product variants have dimensions in Shopify, uses those
- **Estimated dimensions:** If no real dimensions, estimates based on weight and quantity

---

### 4. `tbl_ecom_product_details`
**Purpose:** Individual product/line item information

**Fields Stored (per product):**
- `order_id` - Links to `tbl_ecom_orders.id`
- `category` - null (not set)
- `name` - Product title/name
- `price` - Product price
- `sku` - Product SKU
- `quantity` - Quantity ordered
- `discount_value` - Discount amount for this item
- `discount_type` - "Flat" (default)
- `tax_type` - "None" (default)

**Note:** One row per line item in the order

---

## 2️⃣ Prisma Tables (ORM Managed)

### 5. `OrderEvent`
**Purpose:** Store complete webhook event payload for audit/logging

**Fields Stored:**
- `id` - UUID (auto-generated)
- `shop` - Shopify shop domain
- `topic` - Webhook topic (e.g., "orders/create")
- `orderId` - Shopify order ID (BigInt)
- `payload` - Complete order JSON payload (includes box dimensions)
- `receivedAt` - Timestamp when webhook was received

**Data Type:** JSON field stores the complete order payload

**Use Case:** 
- Audit trail
- Debugging
- Complete order history
- Can be used to reprocess orders if needed

---

### 6. `User`
**Purpose:** Store customer/shop user information

**Fields Stored:**
- `id` - Auto-increment integer
- `email` - Customer email
- `shop` - Shopify shop domain
- `accessToken` - "webhook_user" (placeholder)
- `createdAt` - Timestamp

**Note:** Only creates user if doesn't already exist (checks by email + shop)

---

## 📋 Table Relationships

```
tbl_ecom_orders (id)
    ├── tbl_ecom_consignee_details (order_id)
    ├── tbl_ecom_boxes_details (order_id)
    └── tbl_ecom_product_details (order_id) [multiple rows]

OrderEvent (orderId) - References Shopify order ID, not internal ID
User (email, shop) - Independent, no foreign key
```

---

## 🔍 How to Query Order Data

### Get Complete Order Information:

```sql
-- Main order
SELECT * FROM tbl_ecom_orders WHERE orderid = '1001';

-- Customer details
SELECT * FROM tbl_ecom_consignee_details 
WHERE order_id = (SELECT id FROM tbl_ecom_orders WHERE orderid = '1001');

-- Box dimensions
SELECT * FROM tbl_ecom_boxes_details 
WHERE order_id = (SELECT id FROM tbl_ecom_orders WHERE orderid = '1001');

-- Products
SELECT * FROM tbl_ecom_product_details 
WHERE order_id = (SELECT id FROM tbl_ecom_orders WHERE orderid = '1001');

-- Webhook event (Prisma)
SELECT * FROM OrderEvent WHERE orderId = 6583506010201;
```

### Get All Orders for a Shop:

```sql
SELECT * FROM tbl_ecom_orders 
WHERE shop_name = 'dispatch-solutions.myshopify.com' 
ORDER BY id DESC;
```

---

## 📊 Data Flow

```
Shopify Order Webhook
    ↓
1. Store in OrderEvent (Prisma) - Complete payload
2. Store in User (Prisma) - Customer info
    ↓
3. Insert into tbl_ecom_orders - Main order
    ↓
4. Insert into tbl_ecom_consignee_details - Address
5. Insert into tbl_ecom_boxes_details - Dimensions
6. Insert into tbl_ecom_product_details - Products (one per item)
```

---

## ✅ Summary

| Table | Purpose | Key Field | Links To |
|-------|---------|-----------|----------|
| `tbl_ecom_orders` | Order header | `id` | - |
| `tbl_ecom_consignee_details` | Customer address | `order_id` | `tbl_ecom_orders.id` |
| `tbl_ecom_boxes_details` | Package dimensions | `order_id` | `tbl_ecom_orders.id` |
| `tbl_ecom_product_details` | Products/items | `order_id` | `tbl_ecom_orders.id` |
| `OrderEvent` | Webhook audit | `orderId` | Shopify order ID |
| `User` | Customer info | `email`, `shop` | Independent |

---

**All order data is stored across these 6 tables!** 📦✅

