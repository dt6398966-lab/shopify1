# 🚀 How to Run Your Shopify App

## ✅ Prerequisites Check

Before running, make sure:
- [x] ✅ `.env` file is complete with all values
- [x] ✅ Prisma migrations are done (you already did this!)
- [x] ✅ MySQL database is running
- [x] ✅ All dependencies are installed

---

## 🎯 Step-by-Step: Running the App

### Step 1: Navigate to Project Directory

```bash
cd C:\Users\Admin\Downloads\shopify-app-completed-1\shopify-app-old-without-start-authentication\shopify-app\dispatch-logistics-connector
```

### Step 2: Start the Development Server

```bash
npm run dev
```

**That's it!** The Shopify CLI will automatically:
1. ✅ Create a Cloudflare tunnel (if needed)
2. ✅ Update your app URL
3. ✅ Start the Remix development server
4. ✅ Open your app in the browser

---

## 📋 What Happens When You Run `npm run dev`

### 1. Shopify CLI Starts
You'll see output like:
```
✓ Checking Shopify app configuration...
✓ Creating Cloudflare tunnel...
✓ Tunnel created: https://random-name.trycloudflare.com
✓ App URL updated
```

### 2. Development Server Starts
```
✓ Remix dev server running on http://localhost:3000
✓ Hot reload enabled
```

### 3. Browser Opens
- The CLI will automatically open your app in the browser
- You'll see the login/install page
- Click "Install app" to begin OAuth flow

---

## 🔐 OAuth Flow (First Time)

When you first run the app:

1. **Browser opens** → You see the login page
2. **Enter your shop domain** → e.g., `your-store.myshopify.com`
3. **Click "Connect Store"** or "Install app"
4. **Shopify OAuth page opens** → Review permissions
5. **Click "Install"** → App installs in your store
6. **Redirected to app** → You're now in your app dashboard!

---

## ✅ Verification Checklist

After running `npm run dev`, verify:

- [ ] Development server is running (no errors)
- [ ] Cloudflare tunnel URL is displayed
- [ ] Browser opened with your app
- [ ] OAuth flow completed successfully
- [ ] You can see the app dashboard

---

## 🧪 Test the App

### Test 1: Create a Test Order
1. Go to your Shopify store admin
2. Create a test order
3. Check your app's server logs - you should see:
   ```
   📦 Incoming webhook...
   ✅ HMAC verified: ORDERS_CREATE
   ✅ Order inserted with ID: 123
   ```

### Test 2: Check Database
1. Check your MySQL database
2. Verify order appears in `tbl_ecom_orders` table
3. Check related tables: `tbl_ecom_consignee_details`, `tbl_ecom_product_details`

### Test 3: Check Webhooks
1. Go to Shopify Admin → Settings → Notifications → Webhooks
2. Verify webhooks are registered:
   - `orders/create`
   - `app/uninstalled`
   - GDPR webhooks

---

## 🛠️ Common Commands

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Test Database Connection
```bash
npm run test:db
```

### Run Prisma Commands
```bash
npx prisma generate
npx prisma migrate dev
npx prisma studio  # Open database GUI
```

---

## 🆘 Troubleshooting

### Issue: "Cannot connect to MySQL"
**Solution:**
1. Make sure MySQL is running:
   ```bash
   # Windows
   Get-Service -Name MySQL*
   # Or start MySQL service
   net start MySQL
   ```
2. Check your `.env` file has correct MySQL credentials
3. Test connection: `npm run test:db`

### Issue: "SHOPIFY_API_KEY is not defined"
**Solution:**
1. Check `.env` file exists in project root
2. Verify `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` are set
3. Make sure there are no spaces around `=` sign
4. Restart the dev server

### Issue: "Port 3000 already in use"
**Solution:**
```bash
# Find and kill process on port 3000
# Windows PowerShell
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
PORT=3001 npm run dev
```

### Issue: "Cloudflare tunnel failed"
**Solution:**
1. Check your internet connection
2. Try running `npm run dev` again
3. The CLI will automatically retry

### Issue: "OAuth redirect error"
**Solution:**
1. Make sure `SHOPIFY_APP_URL` in `.env` matches the Cloudflare tunnel URL
2. Check `shopify.app.toml` has correct redirect URLs
3. Run `npm run deploy` to update Shopify configuration

### Issue: "Webhooks not working"
**Solution:**
1. Verify `SHOPIFY_APP_URL` is correct
2. Check webhook endpoints are accessible
3. Verify webhooks are registered in Shopify
4. Check server logs for webhook errors

---

## 📊 Expected Output

When everything works, you should see:

```
✓ Environment variables loaded
✓ Prisma Client generated
✓ Connected to MySQL database!
✓ Shopify CLI starting...
✓ Creating Cloudflare tunnel...
✓ Tunnel created: https://random-name.trycloudflare.com
✓ App URL: https://random-name.trycloudflare.com
✓ Remix dev server running on http://localhost:3000
✓ Opening browser...
```

---

## 🎯 Next Steps After Running

1. **Test Order Creation:**
   - Create a test order in Shopify
   - Verify it appears in your database

2. **Check Logs:**
   - Watch server console for webhook events
   - Verify orders are being processed

3. **Customize App:**
   - Update dashboard content
   - Add your features
   - Test with real orders

---

## 📚 Additional Resources

- **Shopify CLI Docs:** https://shopify.dev/docs/apps/tools/cli
- **Remix Docs:** https://remix.run/docs
- **Prisma Docs:** https://www.prisma.io/docs

---

## ✅ Quick Start Summary

```bash
# 1. Navigate to project
cd C:\Users\Admin\Downloads\shopify-app-completed-1\shopify-app-old-without-start-authentication\shopify-app\dispatch-logistics-connector

# 2. Start the app
npm run dev

# 3. Follow OAuth flow in browser
# 4. Test with a Shopify order
# 5. Check database for synced orders
```

---

**That's it!** Your app should now be running! 🎉

If you encounter any issues, check the troubleshooting section above or the server logs for error messages.

