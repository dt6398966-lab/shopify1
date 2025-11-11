# ⚡ Quick Fix: Setup dsnew03 Database

## 🎯 Problem:
Your `.env` file is pointing to `dispatch` database, but you want to use `dsnew03`.

## ✅ Quick Solution:

### Option 1: Use PowerShell Script (Easiest)

```powershell
.\RUN_MIGRATION_DSNEW03.ps1
```

This script will:
- ✅ Update your `.env` file automatically
- ✅ Run the migration
- ✅ Create tables in `dsnew03`

### Option 2: Manual Steps

**Step 1: Update `.env` file**

Open `.env` and change these lines:

```env
# Change from:
DATABASE_URL=mysql://root:@127.0.0.1:3306/dispatch
MYSQL_DATABASE=dispatch

# To:
DATABASE_URL=mysql://root:@127.0.0.1:3306/dsnew03
MYSQL_DATABASE=dsnew03
```

**Step 2: Run Migration**

```powershell
npx prisma migrate dev --name init_shopify_tables
```

**Step 3: Restart App**

```powershell
shopify app dev
```

---

## ✅ What Will Be Created:

In `dsnew03` database, these tables will be created:

1. **Session** - Shopify OAuth sessions
2. **OrderEvent** - Webhook events log
3. **User** - App users
4. **WebhookConfig** - Webhook secrets

**Note:** Your existing tables (like `tbl_ecom_orders`) will remain untouched!

---

## 🎯 After Migration:

1. ✅ Tables created in `dsnew03`
2. ✅ App connects to `dsnew03`
3. ✅ Orders from Shopify will go to `tbl_ecom_orders` in `dsnew03`
4. ✅ No more database errors!

---

**Quick Command:**
```powershell
.\RUN_MIGRATION_DSNEW03.ps1
```

Or manually update `.env` and run `npx prisma migrate dev --name init_shopify_tables`

