# 📱 How to Install/Re-install Shopify App

## 🚀 Quick Steps:

### Step 1: Make Sure App is Running

First, ensure your app is running in the terminal:
```powershell
cd "C:\Users\Admin\Downloads\shopify-app-completed-1\shopify-app-old-without-start-authentication\shopify-app\dispatch-logistics-connector"
shopify app dev
```

Wait until you see:
```
✅ Ready, watching for changes in your app
└ Using URL: https://alumni-closed-groove-amounts.trycloudflare.com
```

---

### Step 2: Install App in Shopify Admin

**Option A: Using Preview URL (Easiest)**

1. **Copy the Preview URL from your terminal:**
   ```
   https://dispatch-solutions.myshopify.com/admin/oauth/redirect_from_cli?client_id=f39b70fd55542365c109655d5335793e
   ```

2. **Paste it in your browser and press Enter**

3. **You'll be redirected to install the app**

**Option B: Through Shopify Admin**

1. **Go to Shopify Admin:**
   - Open: `https://admin.shopify.com/store/dispatchsolutions-2`
   - Or: `https://admin.shopify.com/store/dispatch-solutions`

2. **Navigate to Apps:**
   - Click **"Apps"** in the left sidebar
   - Or go to: **Settings → Apps and sales channels**

3. **Find "Dispatch Solutions":**
   - Look for "Dispatch Solutions" in the apps list
   - If it's already installed, you'll see it there

4. **Install/Re-install:**
   - **If NOT installed:** Click **"Add app"** or **"Install"**
   - **If ALREADY installed:** 
     - Click on "Dispatch Solutions"
     - Click **"Uninstall"** (if needed)
     - Then click **"Install"** again

---

### Step 3: Authorize the App

1. **You'll see an authorization screen**
2. **Click "Install app"** or **"Allow"**
3. **The app will be installed and webhooks will be registered**

---

### Step 4: Verify Installation

After installation, check your terminal. You should see:
```
🔐 afterAuth hook triggered for shop: dispatchsolutions-2.myshopify.com
🔗 Creating webhooks via API for shop: dispatchsolutions-2.myshopify.com
✅ Custom webhook config created for shop: dispatchsolutions-2.myshopify.com
✅ Webhook created: orders/create
```

---

## 🔄 If App is Already Installed:

### To Re-install (Fix Webhook Issues):

1. **Go to Apps in Shopify Admin**
2. **Click on "Dispatch Solutions"**
3. **Click "Uninstall"** (at the bottom of the app settings)
4. **Confirm uninstallation**
5. **Go back to Apps**
6. **Click "Add app"** or find "Dispatch Solutions" and click **"Install"**
7. **Authorize the app**

---

## ✅ After Installation:

1. **Webhooks will be automatically registered**
2. **Webhook secrets will be generated**
3. **Orders will start syncing to database**

---

## 🧪 Test After Installation:

1. **Place a test order in Shopify**
2. **Check your terminal** - you should see:
   ```
   ✅ HMAC verified: ORDERS_CREATE dispatchsolutions-2.myshopify.com
   🧾 Order received: [order-id]
   ```

3. **Check database:**
   ```powershell
   node check-order-1050.js
   ```

---

## 📋 Current Cloudflare URL:

Your current Cloudflare URL (from terminal):
```
https://alumni-closed-groove-amounts.trycloudflare.com
```

Make sure the app is running with this URL before installing!

---

## ⚠️ Important Notes:

- **Keep the terminal open** while installing
- **The app must be running** (`shopify app dev`) for installation to work
- **Cloudflare URL changes** each time you restart - that's okay for development
- **After installation, webhooks will work automatically**

---

**Follow these steps to install/re-install the app and fix the webhook 401 errors!**

