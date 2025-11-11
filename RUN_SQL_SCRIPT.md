# 🚀 Run SQL Script to Create Tables

## ✅ Safe Method - No Data Loss!

I've created a SQL script that will **ONLY create the 4 Prisma tables** in your `dsnew03` database.

**Your existing tables will NOT be affected!**

---

## 📋 How to Run:

### Option 1: Using MySQL Command Line (Recommended)

```powershell
# If MySQL is in your PATH
mysql -u root -p dsnew03 < create-prisma-tables.sql

# Enter your MySQL password when prompted (or press Enter if no password)
```

### Option 2: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. Select `dsnew03` database
4. File → Open SQL Script → Select `create-prisma-tables.sql`
5. Click "Execute" (⚡ button)

### Option 3: Using phpMyAdmin

1. Open phpMyAdmin in browser
2. Select `dsnew03` database
3. Click "SQL" tab
4. Copy and paste contents of `create-prisma-tables.sql`
5. Click "Go"

### Option 4: Using PowerShell (if MySQL is installed)

```powershell
# Read SQL file and execute
$sql = Get-Content create-prisma-tables.sql -Raw
mysql -u root -p dsnew03 -e $sql
```

---

## ✅ After Running SQL:

1. **Verify tables created:**
   ```sql
   USE dsnew03;
   SHOW TABLES LIKE 'Session';
   SHOW TABLES LIKE 'OrderEvent';
   SHOW TABLES LIKE 'User';
   SHOW TABLES LIKE 'WebhookConfig';
   ```

2. **Mark migration as applied:**
   ```powershell
   npx prisma migrate resolve --applied 20251111064457_
   ```

3. **Restart your app:**
   ```powershell
   shopify app dev
   ```

---

## 📊 What Gets Created:

- ✅ **Session** - Shopify OAuth sessions
- ✅ **OrderEvent** - Webhook events log
- ✅ **User** - App users  
- ✅ **WebhookConfig** - Webhook secrets

**All in `dsnew03` database, alongside your existing tables!**

---

## 🎯 Quick Steps:

1. **Run SQL script** (choose one method above)
2. **Verify tables** (optional check)
3. **Restart app:** `shopify app dev`
4. **Done!** ✅

---

**The SQL script uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times!**

