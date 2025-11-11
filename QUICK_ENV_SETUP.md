# ⚡ Quick Environment Variables Setup

## ✅ You Already Have:
- ✅ `SHOPIFY_APP_URL` = Your Cloudflare tunnel URL

## 🔑 Get These Values:

---

## 1️⃣ Shopify API Credentials

### Quick Steps:
1. Go to: **https://partners.shopify.com/**
2. Login → Click **"Apps"** → Select **"Dispatch Solutions"**
3. Click **"App setup"** → Scroll to **"API credentials"**
4. Copy:
   - **Client ID** → This is `SHOPIFY_API_KEY`
   - **Client secret** → This is `SHOPIFY_API_SECRET`

**Note:** If you don't see an app, create one first!

---

## 2️⃣ MySQL Database Credentials

### Check Your Main Project Config

Your main project (`dispatchnewtemplate`) uses these database settings. Check your `config.env` file there:

**Location:** `C:\Users\Admin\Desktop\deepnashu29sep\dispatchnewtemplate\config.env`

Look for these variables:
- `DB_USER` - Your MySQL username
- `DB_PASS` - Your MySQL password  
- `DB_NAME` - Your database name
- `DB_HOST` - Your MySQL host

### Default Values (if not in config.env):
Based on your main project's `config/database.js`:
- **MYSQL_HOST** = `localhost`
- **MYSQL_USER** = `root` (or value from `DB_USER`)
- **MYSQL_PASSWORD** = (value from `DB_PASS` in config.env, or empty `""`)
- **MYSQL_DATABASE** = `dsnew03` (or value from `DB_NAME` in config.env)
- **MYSQL_PORT** = `3306`

---

## 3️⃣ Complete .env File

Once you have all values, create/update your `.env` file:

```env
# Shopify App Configuration
SHOPIFY_API_KEY=your_client_id_from_shopify
SHOPIFY_API_SECRET=your_client_secret_from_shopify
SHOPIFY_APP_URL=https://pools-nicole-growing-divine.trycloudflare.com
SCOPES=read_orders,write_orders,read_products,write_products,read_metaobjects,write_metaobjects,read_metaobject_definitions,write_metaobject_definitions

# Database Configuration (Prisma)
# Format: mysql://username:password@host:port/database_name
DATABASE_URL=mysql://root:yourpassword@localhost:3306/dsnew03

# MySQL Direct Connection (for dbMysl.js)
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=dsnew03
MYSQL_PORT=3306
MYSQL_CONNECTION_LIMIT=100

# Node Environment
NODE_ENV=development
```

---

## 📋 Step-by-Step:

### Step 1: Get Shopify Credentials
1. Open: https://partners.shopify.com/
2. Apps → Your App → App setup → API credentials
3. Copy Client ID and Client secret

### Step 2: Get MySQL Credentials
1. Open: `C:\Users\Admin\Desktop\deepnashu29sep\dispatchnewtemplate\config.env`
2. Look for: `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_HOST`
3. Use those values (or defaults if not found)

### Step 3: Update .env File
1. Open `.env` file in the Shopify app folder
2. Replace all placeholder values with actual values
3. Save the file

### Step 4: Test
```bash
# Test database connection
npm run test:db

# If successful, run migrations
npx prisma migrate dev
```

---

## 🎯 Quick Reference

| Variable | Where to Get It |
|----------|----------------|
| `SHOPIFY_API_KEY` | Shopify Partners → App → API credentials → Client ID |
| `SHOPIFY_API_SECRET` | Shopify Partners → App → API credentials → Client secret |
| `SHOPIFY_APP_URL` | ✅ Already have (Cloudflare tunnel) |
| `MYSQL_HOST` | Usually `localhost` (check main project's config.env) |
| `MYSQL_USER` | Usually `root` (check main project's config.env for `DB_USER`) |
| `MYSQL_PASSWORD` | Check main project's config.env for `DB_PASS` |
| `MYSQL_DATABASE` | Usually `dsnew03` (check main project's config.env for `DB_NAME`) |
| `MYSQL_PORT` | Usually `3306` |
| `DATABASE_URL` | Build from MySQL credentials: `mysql://user:pass@host:port/db` |

---

## ✅ Checklist

- [ ] Got `SHOPIFY_API_KEY` from Shopify Partners Dashboard
- [ ] Got `SHOPIFY_API_SECRET` from Shopify Partners Dashboard
- [ ] Got MySQL credentials from main project's `config.env`
- [ ] Updated `.env` file with all values
- [ ] Tested database connection

---

**Need more details?** See `HOW_TO_GET_ENV_VARIABLES.md` for complete instructions!

