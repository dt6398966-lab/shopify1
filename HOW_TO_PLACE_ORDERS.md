# How to Place Orders - Shopify Store Access

## 📍 **WHERE TO PLACE ORDERS**

### **Option 1: Development Store (Recommended for Testing)**

Based on your configuration, the development store appears to be:
```
dispatchsolutions-2.myshopify.com
```

**Access the store:**
1. **Admin Panel**: `https://dispatchsolutions-2.myshopify.com/admin`
2. **Storefront (Customer View)**: `https://dispatchsolutions-2.myshopify.com`

---

### **Option 2: Find Your Connected Store**

To find which Shopify store is connected to your app:

1. **Check Database**:
   - Your app saves store info in MySQL table: `tbl_shopify_integration`
   - Column: `shopyfy_url` contains the store domain

2. **Check Shopify Partner Dashboard**:
   - Go to: https://partners.shopify.com
   - Navigate to your app: **"Dispatch Solutions"**
   - Check "Test on development store" section

---

## 🛒 **HOW TO PLACE A TEST ORDER**

### **Method 1: Via Storefront (Customer View)**

1. Open your store URL: `https://dispatchsolutions-2.myshopify.com`
2. Browse products
3. Add items to cart
4. Go to checkout
5. Complete the order
6. **Webhook will automatically trigger** → Order saved to your database

### **Method 2: Via Admin Panel (Create Order Manually)**

1. Login to Admin: `https://dispatchsolutions-2.myshopify.com/admin`
2. Go to **Orders** → **Create order**
3. Add products
4. Set customer details
5. Complete the order
6. **Webhook will trigger** → Order saved to database

### **Method 3: Using Shopify CLI (Test Webhook)**

```bash
cd "C:\Users\Admin\Desktop\deepnashu29sep\dispatchnewtemplate\controller\shopify-app\shopify-app\dispatch-logistics-connector"
npm run dev
```

Then in another terminal:
```bash
shopify app generate webhook
# Or trigger test webhook
shopify webhook trigger
```

---

## ✅ **VERIFY ORDER RECEIVED**

After placing an order, check:

1. **Database** (`dsnew02`):
   - Table: `tbl_ecom_orders` - Order should be inserted
   - Table: `tbl_ecom_consignee_details` - Customer details
   - Table: `tbl_ecom_product_details` - Product items

2. **App Logs**:
   - Check console for: `✅ Order inserted: [order_id]`
   - Check for: `✅ HMAC verified: orders/create [shop_domain]`

3. **Webhook Endpoint**:
   - Your webhook URL: `https://tion-britain-timer-roman.trycloudflare.com/webhooks/orders/create`
   - Shopify sends webhook to this URL when order is created

---

## 🔍 **FIND YOUR STORE URL**

### **Quick Check - Run This Query:**

If you have access to MySQL database `dsnew02`:

```sql
SELECT shopyfy_url, accessToken, scope 
FROM tbl_shopify_integration;
```

This will show all connected Shopify stores.

---

## 📝 **IMPORTANT NOTES**

1. **App Must Be Installed**: 
   - The Shopify app must be installed on the store first
   - Installation happens via OAuth callback: `/auth/callback`

2. **Webhook Must Be Active**:
   - Webhook subscription: `orders/create`
   - Endpoint: `/webhooks/orders/create`
   - Must be accessible (not localhost)

3. **Development Store**:
   - If using development store, you can create unlimited test orders
   - No real payment required (use test payment methods)

---

## 🚀 **QUICK START**

1. **Start your app**:
   ```bash
   cd "C:\Users\Admin\Desktop\deepnashu29sep\dispatchnewtemplate\controller\shopify-app\shopify-app\dispatch-logistics-connector"
   npm run dev
   ```

2. **Access store**: `https://dispatchsolutions-2.myshopify.com`

3. **Place order** via storefront or admin

4. **Check database** for order data

---

## ❓ **IF STORE NOT FOUND**

1. Check Shopify Partner Dashboard
2. Verify app is installed on the store
3. Check `tbl_shopify_integration` table in database
4. Re-install app if needed: `https://your-app-url/auth?shop=your-store.myshopify.com`

