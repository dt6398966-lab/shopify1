# ☁️ Cloudflare Tunnel Setup Guide

## Overview

Cloudflare tunnels are used to expose your local development server to the internet, which is required for Shopify webhooks and OAuth callbacks to work during development.

## ✅ Automatic Setup (Recommended)

The Shopify CLI **automatically handles Cloudflare tunnels** when you run:

```bash
npm run dev
```

or

```bash
shopify app dev
```

The CLI will:
1. Automatically download and use `cloudflared` if needed
2. Create a tunnel URL (e.g., `https://pools-nicole-growing-divine.trycloudflare.com`)
3. Update your app configuration with the tunnel URL
4. Forward all requests to your local server

**You don't need to manually configure anything!** Just run `npm run dev` and the CLI handles everything.

---

## 🔧 Manual Setup (If Needed)

If you need to manually set up Cloudflare tunnel, follow these steps:

### Step 1: Verify Cloudflared is Available

The project already includes `cloudflared.exe` in the root directory. If you need to download it:

**Windows:**
```powershell
# Download cloudflared for Windows
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "cloudflared.exe"
```

**Or use npm:**
```bash
npm install -g cloudflared
```

### Step 2: Start Cloudflare Tunnel Manually

```bash
# Start tunnel on port 3000 (or your app's port)
cloudflared tunnel --url http://localhost:3000
```

This will give you a URL like: `https://random-name.trycloudflare.com`

### Step 3: Update Environment Variables

Update your `.env` file with the Cloudflare tunnel URL:

```env
SHOPIFY_APP_URL=https://your-tunnel-url.trycloudflare.com
```

### Step 4: Update shopify.app.toml

Update the `application_url` and `redirect_urls` in `shopify.app.toml`:

```toml
application_url = "https://your-tunnel-url.trycloudflare.com"

[auth]
redirect_urls = [
  "https://your-tunnel-url.trycloudflare.com/auth/callback",
  "https://your-tunnel-url.trycloudflare.com/auth"
]
```

---

## 🚀 Using with Shopify CLI (Recommended)

The **easiest way** is to let Shopify CLI handle it:

1. **Start your app:**
   ```bash
   npm run dev
   ```

2. **The CLI will:**
   - Automatically create a Cloudflare tunnel
   - Display the tunnel URL
   - Update your app configuration
   - Start your development server

3. **You'll see output like:**
   ```
   ✓ Tunnel created: https://pools-nicole-growing-divine.trycloudflare.com
   ✓ App URL updated in shopify.app.toml
   ✓ Development server running on http://localhost:3000
   ```

---

## 📝 Environment Variables

Add these to your `.env` file (optional - CLI handles this automatically):

```env
# Cloudflare Tunnel (optional - CLI handles automatically)
CLOUDFLARE_TUNNEL_URL=https://your-tunnel-url.trycloudflare.com

# Your app URL (will be set by CLI automatically)
SHOPIFY_APP_URL=https://your-tunnel-url.trycloudflare.com
```

**Note:** The Shopify CLI automatically updates `SHOPIFY_APP_URL` when it creates a tunnel, so you don't need to set this manually.

---

## 🔍 Troubleshooting

### Issue: "Tunnel creation failed"
**Solution:**
1. Check your internet connection
2. Try running `npm run dev` again
3. The CLI will automatically retry

### Issue: "Webhooks not receiving requests"
**Solution:**
1. Make sure your tunnel URL is accessible
2. Check that `SHOPIFY_APP_URL` in `.env` matches your tunnel URL
3. Verify webhook endpoints are registered in Shopify

### Issue: "OAuth callback not working"
**Solution:**
1. Ensure `redirect_urls` in `shopify.app.toml` includes your tunnel URL
2. Run `npm run deploy` to update Shopify with new URLs
3. Or let CLI handle it automatically with `npm run dev`

### Issue: "Tunnel URL changes every time"
**Solution:**
- This is normal for free Cloudflare tunnels
- The CLI automatically updates your configuration
- For production, use a fixed domain with Cloudflare Tunnel

---

## 🌐 Production Setup

For production, you should:

1. **Use a fixed domain** (not `trycloudflare.com`)
2. **Set up Cloudflare Tunnel with your domain:**
   ```bash
   cloudflared tunnel create dispatch-solutions
   cloudflared tunnel route dns dispatch-solutions app.yourdomain.com
   ```

3. **Update your `.env` for production:**
   ```env
   SHOPIFY_APP_URL=https://app.yourdomain.com
   ```

4. **Update `shopify.app.toml`:**
   ```toml
   application_url = "https://app.yourdomain.com"
   ```

---

## ✅ Quick Start

**Just run this:**

```bash
npm run dev
```

That's it! The Shopify CLI will handle everything automatically.

---

## 📚 Additional Resources

- [Shopify CLI Documentation](https://shopify.dev/docs/apps/tools/cli)
- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Shopify App Development Guide](https://shopify.dev/docs/apps/getting-started)

---

**Last Updated**: $(date)
**Status**: ✅ Ready to Use

