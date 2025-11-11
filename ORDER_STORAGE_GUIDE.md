# 📦 Shopify Order Storage Guide

## 🎯 When a Client Places an Order from Shopify

When a client places an order from their Shopify store, the order details are automatically stored in **multiple tables** in your `dsnew03` database.

---

## 📊 Tables Where Order Data is Stored

### 1️⃣ **`tbl_ecom_orders`** (Main Order Table)
**Primary table** - Stores the main order information.

**Columns Stored:**
- `id` - Auto-incremented order ID (primary key)
- `channel` - Always `"shopify"` for Shopify orders
- `ref_number` - Shopify order name (e.g., "#1001")
- `orderid` - Shopify order number
- `invoice_no` - Shopify order number (duplicate of orderid)
- `client_id` - Currently set to `0` (can be mapped to your client)
- `payment_mode` - Payment terms from Shopify
- `collectable_amount` - Total price (COD amount)
- `warehouse_id` - Warehouse ID (null initially)
- `total_weight` - Total weight in grams
- `weight_unit` - Always `"gm"`
- `grand_total` - Total price
- `total_qty` - Total quantity of all items
- `box_qty` - Number of boxes (default: 1)
- `total_tax` - Total tax amount
- `total_discount` - Total discount amount
- `is_unprocessed` - Set to `1` (unprocessed)
- `shop_name` - Shopify shop domain (e.g., "dispatch-solutions.myshopify.com")

**Location in Code:** Line 680-704 in `webhooks.orders.create.js`

---

### 2️⃣ **`tbl_ecom_consignee_details`** (Shipping & Billing Address)
Stores customer shipping and billing address information.

**Columns Stored:**
- `order_id` - Foreign key to `tbl_ecom_orders.id`
- `first_name` - Shipping first name
- `last_name` - Shipping last name
- `email` - Customer email
- `phone` - Shipping phone number
- `address_line1` - Shipping address line 1
- `address_line2` - Shipping address line 2
- `country` - Shipping country
- `state` - Shipping state/province
- `city` - Shipping city
- `pincode` - Shipping zip/postal code
- `billing_same_as_shipping` - 1 if billing same as shipping, 0 otherwise
- `billing_first_name` - Billing first name
- `billing_last_name` - Billing last name
- `billing_email` - Billing email
- `billing_phone` - Billing phone
- `billing_address_line1` - Billing address line 1
- `billing_address_line2` - Billing address line 2
- `billing_country` - Billing country
- `billing_state` - Billing state/province
- `billing_city` - Billing city
- `billing_pincode` - Billing zip/postal code

**Location in Code:** Line 717-748 in `webhooks.orders.create.js`

---

### 3️⃣ **`tbl_ecom_boxes_details`** (Package Dimensions)
Stores box/package dimensions and weight for shipping.

**Columns Stored:**
- `order_id` - Foreign key to `tbl_ecom_orders.id`
- `package_type` - Always `"box"`
- `length` - Box length in cm (calculated or estimated)
- `breadth` - Box breadth in cm (calculated or estimated)
- `height` - Box height in cm (calculated or estimated)
- `dimension_unit` - Always `"cm"`
- `weight` - Total weight in grams
- `weight_unit` - Always `"gm"`

**Note:** Dimensions are calculated using:
- **Real dimensions** from Shopify product variants (if available)
- **Estimated dimensions** based on weight and quantity (if real dimensions not available)

**Location in Code:** Line 757-772 in `webhooks.orders.create.js`

---

### 4️⃣ **`tbl_ecom_product_details`** (Product/Line Items)
Stores individual products/line items from the order.

**Columns Stored (per product):**
- `order_id` - Foreign key to `tbl_ecom_orders.id`
- `category` - Product category (null initially)
- `name` - Product title/name
- `price` - Product price
- `sku` - Product SKU
- `quantity` - Quantity ordered
- `discount_value` - Discount amount for this product
- `discount_type` - Always `"Flat"`
- `tax_type` - Always `"None"`

**Note:** One row per product in the order. If order has 3 products, there will be 3 rows.

**Location in Code:** Line 779-816 in `webhooks.orders.create.js`

---

### 5️⃣ **`OrderEvent`** (Prisma Table - Webhook Log)
Stores the complete webhook payload for audit/logging purposes.

**Columns Stored:**
- `id` - Unique event ID
- `shop` - Shopify shop domain
- `topic` - Webhook topic (e.g., "orders/create")
- `orderId` - Shopify order ID (BigInt)
- `payload` - Complete order JSON with all details including:
  - Full order data
  - Box dimensions (calculated)
  - Product weights
  - All metadata

**Location in Code:** Line 605-619 in `webhooks.orders.create.js`

---

### 6️⃣ **`User`** (Prisma Table - Customer Info)
Stores customer/user information.

**Columns Stored:**
- `id` - Auto-incremented user ID
- `email` - Customer email
- `shop` - Shopify shop domain
- `accessToken` - Placeholder value ("webhook_user")
- `createdAt` - Timestamp

**Note:** Only created if customer email exists and user doesn't already exist.

**Location in Code:** Line 621-650 in `webhooks.orders.create.js`

---

## 🔄 Order Processing Flow

```
1. Client places order in Shopify
   ↓
2. Shopify sends webhook to your app
   ↓
3. Webhook verified (HMAC check)
   ↓
4. Order data fetched from Shopify API (if needed)
   ↓
5. Data stored in database tables:
   ├─ tbl_ecom_orders (main order)
   ├─ tbl_ecom_consignee_details (addresses)
   ├─ tbl_ecom_boxes_details (package info)
   ├─ tbl_ecom_product_details (products)
   ├─ OrderEvent (webhook log)
   └─ User (customer info)
   ↓
6. Transaction committed
   ↓
7. Order ready for processing in Dispatch Solutions
```

---

## 📋 Quick Reference: Table Relationships

```
tbl_ecom_orders (id)
    ├─→ tbl_ecom_consignee_details (order_id)
    ├─→ tbl_ecom_boxes_details (order_id)
    └─→ tbl_ecom_product_details (order_id) [multiple rows]

OrderEvent (orderId) - References Shopify order ID
User (email, shop) - Customer information
```

---

## 🔍 How to Query Order Data

### Get Complete Order Details:
```sql
SELECT 
    o.*,
    c.*,
    b.*,
    GROUP_CONCAT(p.name) as products
FROM tbl_ecom_orders o
LEFT JOIN tbl_ecom_consignee_details c ON o.id = c.order_id
LEFT JOIN tbl_ecom_boxes_details b ON o.id = b.order_id
LEFT JOIN tbl_ecom_product_details p ON o.id = p.order_id
WHERE o.orderid = 'YOUR_SHOPIFY_ORDER_NUMBER'
GROUP BY o.id;
```

### Get All Orders from a Specific Shop:
```sql
SELECT * FROM tbl_ecom_orders 
WHERE shop_name = 'dispatch-solutions.myshopify.com'
ORDER BY id DESC;
```

### Get Order with Products:
```sql
SELECT 
    o.id,
    o.ref_number,
    o.orderid,
    p.name as product_name,
    p.quantity,
    p.price
FROM tbl_ecom_orders o
JOIN tbl_ecom_product_details p ON o.id = p.order_id
WHERE o.orderid = 'YOUR_SHOPIFY_ORDER_NUMBER';
```

---

## ✅ Summary

**When a client places an order from Shopify, the order details are stored in:**

1. ✅ **`tbl_ecom_orders`** - Main order information
2. ✅ **`tbl_ecom_consignee_details`** - Shipping & billing addresses
3. ✅ **`tbl_ecom_boxes_details`** - Package dimensions & weight
4. ✅ **`tbl_ecom_product_details`** - Individual products (one row per product)
5. ✅ **`OrderEvent`** (Prisma) - Complete webhook payload for logging
6. ✅ **`User`** (Prisma) - Customer information

**All tables are in the `dsnew03` database.**

---

**File Location:** `app/routes/webhooks.orders.create.js`

