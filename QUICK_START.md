# 🚀 Quick Start Guide - Dispatch Solutions Shopify App

## ⚡ Get Started in 3 Steps

### Step 1: Create `.env` File

Copy `ENV_TEMPLATE.txt` to `.env`:

```bash
# Windows PowerShell
Copy-Item ENV_TEMPLATE.txt .env

# Or manually create .env and copy the content
```

Then edit `.env` and fill in:
- `SHOPIFY_API_KEY` - From Shopify Partners Dashboard
- `SHOPIFY_API_SECRET` - From Shopify Partners Dashboard
- MySQL connection details

**Note:** Leave `SHOPIFY_APP_URL` empty - the CLI will set it automatically!

### Step 2: Run Prisma Setup

```bash
npx prisma generate
npx prisma migrate dev
```

### Step 3: Start Development Server

```bash
npm run dev
```

**That's it!** The Shopify CLI will:
- ✅ Automatically create a Cloudflare tunnel
- ✅ Update your app URL
- ✅ Start your development server
- ✅ Open your app in the browser

---

## ☁️ Cloudflare Setup

**No manual setup needed!** 

When you run `npm run dev`, the Shopify CLI automatically:
1. Creates a Cloudflare tunnel
2. Gives you a URL like `https://random-name.trycloudflare.com`
3. Updates your configuration
4. Forwards all requests to your local server

**You don't need to do anything!** Just run `npm run dev`.

For more details, see `CLOUDFLARE_SETUP.md`.

---

## 📋 What Happens When You Run `npm run dev`

1. **Shopify CLI starts:**
   - Checks your configuration
   - Creates/updates Cloudflare tunnel
   - Displays tunnel URL

2. **Development server starts:**
   - Remix dev server on `http://localhost:3000`
   - Hot reload enabled

3. **App opens in browser:**
   - OAuth flow begins
   - App installs in your Shopify store

---

## ✅ Verification Checklist

Before running, make sure:

- [ ] `.env` file exists with all required variables
- [ ] `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` are set
- [ ] MySQL database is running
- [ ] Prisma migrations have been run (`npx prisma migrate dev`)

---

## 🎯 Next Steps

1. **Test OAuth Flow:**
   - Run `npm run dev`
   - Click "Install app" in the browser
   - Complete OAuth flow

2. **Test Webhooks:**
   - Create a test order in your Shopify store
   - Check server logs for webhook receipt
   - Verify order in database

3. **Start Building:**
   - Customize the app dashboard
   - Add your features
   - Test with real orders

---

## 🆘 Need Help?

- **Setup Issues:** See `SETUP_COMPLETE.md`
- **Cloudflare Issues:** See `CLOUDFLARE_SETUP.md`
- **Environment Variables:** See `ENV_TEMPLATE.txt`

---

**Ready to go!** Just run `npm run dev` and start building! 🚀

