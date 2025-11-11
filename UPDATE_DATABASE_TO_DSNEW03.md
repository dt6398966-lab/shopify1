# 🔧 Update Database to dsnew03

## ✅ What You Need to Do:

### Step 1: Update `.env` File

Change your `.env` file to use `dsnew03`:

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

### Step 2: Run Prisma Migrations

After updating `.env`, run:

```bash
npx prisma migrate dev --name init
```

This will:
- Create tables in `dsnew03` database:
  - `Session` (for Shopify sessions)
  - `OrderEvent` (for webhook events)
  - `User` (for app users)
  - `WebhookConfig` (for webhook secrets)

### Step 3: Verify Tables Created

Check that tables are created:

```bash
# Connect to MySQL
mysql -u root -p

# Use database
USE dsnew03;

# Show tables
SHOW TABLES;

# You should see:
# - Session
# - OrderEvent
# - User
# - WebhookConfig
```

---

## 📋 Tables That Will Be Created:

1. **Session** - Stores Shopify OAuth sessions
2. **OrderEvent** - Stores webhook events (orders/create, etc.)
3. **User** - Stores app users
4. **WebhookConfig** - Stores webhook secrets per shop

---

## ✅ After Migration:

1. Restart your app: `shopify app dev`
2. The database error should be gone
3. All tables will be in `dsnew03` database

---

**Note:** The `dispatch1` database mentioned in your main project is different - this Shopify app uses its own tables in `dsnew03`.

