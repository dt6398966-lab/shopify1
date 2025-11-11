# 🔧 Fix Database and Run Migration

## ⚠️ Current Issue:
Your `.env` file is pointing to `dispatch` database, but you need `dsnew03`.

## ✅ Quick Fix (2 Steps):

### Step 1: Update `.env` File

Open your `.env` file and make sure these lines are:

```env
DATABASE_URL=mysql://root:@127.0.0.1:3306/dsnew03
MYSQL_DATABASE=dsnew03
```

**Important:** Both must say `dsnew03` (not `dispatch` or `dispatch1`)

### Step 2: Run Migration

In PowerShell, run:

```powershell
npx prisma migrate dev --name init_shopify_tables
```

This will create tables in `dsnew03`:
- ✅ Session
- ✅ OrderEvent  
- ✅ User
- ✅ WebhookConfig

---

## ✅ After Migration:

Restart your app:
```powershell
shopify app dev
```

You should see:
```
✅ Connected to MySQL database!
```
(No more errors!)

---

## 🎯 Summary:

1. **Update `.env`** → Change `DATABASE_URL` and `MYSQL_DATABASE` to `dsnew03`
2. **Run migration** → `npx prisma migrate dev --name init_shopify_tables`
3. **Restart app** → `shopify app dev`

That's it! 🚀

