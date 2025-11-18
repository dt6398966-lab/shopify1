# 🔧 Fix Webhook 401 Unauthorized Error

## ❌ Current Issue:

**Webhooks are being received but failing with 401 Unauthorized:**
```
📦 Incoming webhook...
❌ Webhook handler error: Response {
  status: 401,
  statusText: 'Unauthorized'
}
```

## 🔍 Root Cause:

The Shopify SDK's `authenticate.webhook()` is using `SHOPIFY_API_SECRET` for HMAC verification, but:
1. Shopify might be using a different webhook secret
2. The webhook secret in the database might not match
3. The SDK needs to be configured to use the correct webhook secret

---

## ✅ Solution:

### Option 1: Re-install App (Recommended - Easiest)

This will regenerate webhook secrets and re-register webhooks:

1. **Go to Shopify Admin:**
   - Apps → Dispatch Solutions
   - Uninstall the app
   - Re-install it

2. **This will:**
   - Generate a new webhook secret
   - Register webhooks with the current Cloudflare URL
   - Store the secret in the database
   - Match the secret with Shopify

### Option 2: Check Webhook Secret in Database

1. **Check if webhook secret exists:**
   ```powershell
   node check-webhooks.js
   ```

2. **If no secret exists:**
   - Re-install the app (Option 1)

### Option 3: Manual Webhook Secret Update

If you know the webhook secret Shopify is using:

1. **Update in database:**
   ```sql
   UPDATE WebhookConfig 
   SET webhookSecret = 'your_webhook_secret_here' 
   WHERE shop = 'your-shop.myshopify.com';
   ```

2. **Or update in Shopify Admin:**
   - Settings → Notifications → Webhooks
   - Find your webhook
   - Check the webhook secret

---

## 📋 Current Status:

- ✅ Webhooks are being received
- ✅ Cloudflare tunnel is working
- ✅ App is running
- ❌ HMAC verification failing (401 Unauthorized)
- ❌ Orders not syncing to database

---

## 🚀 Quick Fix:

**The easiest solution is to re-install the app:**

1. Go to Shopify Admin → Apps
2. Uninstall "Dispatch Solutions"
3. Re-install it
4. This will fix the webhook secret mismatch

---

## 💡 Why This Happens:

- Webhook secrets are generated when the app is installed
- If the app was installed before, the secret might be outdated
- The SDK needs the correct secret to verify HMAC
- Re-installing regenerates everything correctly

---

**After re-installing, webhooks should work and orders will sync to the database!**

