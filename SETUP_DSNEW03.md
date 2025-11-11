# 🗄️ Setup Database dsnew03 - Step by Step

## ✅ What We'll Do:

1. Update `.env` to use `dsnew03` database
2. Run Prisma migrations to create tables in `dsnew03`
3. Verify tables are created

---

## 📋 Step 1: Update `.env` File

Open your `.env` file and make sure these lines are set:

```env
# Database Configuration (Prisma)
DATABASE_URL=mysql://root:@127.0.0.1:3306/dsnew03

# MySQL Direct Connection (for dbMysl.js)
MYSQL_HOST=127.0.0.1
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=dsnew03
MYSQL_PORT=3306
MYSQL_CONNECTION_LIMIT=100
```

**Important:** Make sure `DATABASE_URL` and `MYSQL_DATABASE` both use `dsnew03`!

---

## 📋 Step 2: Run Prisma Migrations

In your terminal, run:

```bash
npx prisma migrate dev --name init_shopify_tables
```

This will:
- ✅ Connect to `dsnew03` database
- ✅ Create these tables:
  - `Session` - For Shopify OAuth sessions
  - `OrderEvent` - For storing webhook events
  - `User` - For app users
  - `WebhookConfig` - For webhook secrets

---

## 📋 Step 3: Verify Tables Created

Check that tables are created in `dsnew03`:

**Option A: Using MySQL Command Line**
```bash
mysql -u root -p
USE dsnew03;
SHOW TABLES;
```

**Option B: Using Prisma Studio (GUI)**
```bash
npx prisma studio
```
This will open a web interface where you can see all tables.

**Expected Tables:**
- `Session`
- `OrderEvent`
- `User`
- `WebhookConfig`

---

## ✅ Step 4: Restart Your App

After migrations are complete:

1. **Stop current app** (Press `q` in terminal or Ctrl+C)
2. **Restart:**
   ```bash
   shopify app dev
   ```

3. **Verify:** You should see:
   ```
   ✅ Connected to MySQL database!
   ```
   (No more database errors!)

---

## 📊 What Tables Are Created?

### 1. **Session** Table
- Stores Shopify OAuth session data
- Required for app authentication
- Fields: `id`, `shop`, `accessToken`, `expires`, etc.

### 2. **OrderEvent** Table
- Stores webhook events from Shopify
- Logs all `orders/create` webhooks
- Fields: `id`, `shop`, `topic`, `orderId`, `payload`, etc.

### 3. **User** Table
- Stores app user information
- Fields: `id`, `email`, `shop`, `accessToken`, etc.

### 4. **WebhookConfig** Table
- Stores webhook secrets per shop
- Required for webhook security
- Fields: `id`, `shop`, `webhookSecret`, `isActive`, etc.

---

## 🎯 Quick Commands Summary

```bash
# 1. Update .env file (manually edit it)

# 2. Run migrations
npx prisma migrate dev --name init_shopify_tables

# 3. Verify (optional)
npx prisma studio

# 4. Restart app
shopify app dev
```

---

## ✅ After Setup:

Your app will:
- ✅ Connect to `dsnew03` database
- ✅ Store Shopify sessions in `Session` table
- ✅ Store webhook events in `OrderEvent` table
- ✅ Store user data in `User` table
- ✅ Store webhook configs in `WebhookConfig` table
- ✅ Insert orders into your existing `tbl_ecom_orders` table (in same database)

---

## 🆘 Troubleshooting

### "Database dsnew03 does not exist"
**Solution:** Create it first:
```sql
CREATE DATABASE dsnew03;
```

### "Migration failed"
**Solution:** 
1. Check `.env` file has correct `DATABASE_URL`
2. Make sure MySQL is running
3. Verify database `dsnew03` exists

### "Tables already exist"
**Solution:** 
- If tables exist from previous migration, that's fine!
- Prisma will skip creating existing tables
- Or reset: `npx prisma migrate reset` (⚠️ deletes all data!)

---

**Ready?** Update your `.env` file and run the migration command! 🚀

