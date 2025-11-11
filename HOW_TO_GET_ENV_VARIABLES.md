# 📋 How to Get All Environment Variables

## ✅ You Already Have:
- ✅ `SHOPIFY_APP_URL` - From Cloudflare tunnel (e.g., `https://pools-nicole-growing-divine.trycloudflare.com`)

## 🔑 Now Get These:

---

## 1️⃣ Shopify API Credentials

### Step 1: Go to Shopify Partners Dashboard
1. Visit: https://partners.shopify.com/
2. Log in with your Shopify Partners account
3. If you don't have an account, create one at: https://partners.shopify.com/signup

### Step 2: Select Your App
1. Click on **"Apps"** in the left sidebar
2. Find and click on **"Dispatch Solutions"** (or your app name)
3. If you don't have an app yet:
   - Click **"Create app"**
   - Choose **"Create app manually"**
   - Name it: **"Dispatch Solutions"**
   - Click **"Create app"**

### Step 3: Get API Credentials
1. In your app dashboard, click on **"App setup"** (or **"Configuration"**)
2. Scroll down to **"API credentials"** section
3. You'll see:
   - **Client ID** (this is your `SHOPIFY_API_KEY`)
   - **Client secret** (this is your `SHOPIFY_API_SECRET`)

### Step 4: Copy the Values
- **SHOPIFY_API_KEY** = Copy the **Client ID**
- **SHOPIFY_API_SECRET** = Copy the **Client secret**

**Example:**
```env
SHOPIFY_API_KEY=f39b70fd55542365c109655d5335793e
SHOPIFY_API_SECRET=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 2️⃣ Database Credentials (MySQL)

### Option A: If You Already Have MySQL Running

Check your existing MySQL setup:

**Windows (Command Prompt or PowerShell):**
```bash
# Check if MySQL is running
Get-Service -Name MySQL*

# Or check MySQL configuration
# Usually located at: C:\ProgramData\MySQL\MySQL Server X.X\my.ini
```

**Common Default Values:**
```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=dispatch1
MYSQL_PORT=3306
```

### Option B: If You Need to Set Up MySQL

1. **Install MySQL:**
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Or use XAMPP/WAMP which includes MySQL

2. **Set Root Password:**
   - During installation, you'll be asked to set a root password
   - Remember this password - it's your `MYSQL_PASSWORD`

3. **Create Database:**
   ```sql
   -- Connect to MySQL
   mysql -u root -p
   
   -- Enter your root password when prompted
   
   -- Create database
   CREATE DATABASE dispatch1;
   
   -- Or if you want to use a different name:
   CREATE DATABASE dispatch;
   
   -- Exit MySQL
   exit;
   ```

4. **Get Your Credentials:**
   - **MYSQL_HOST**: Usually `localhost` or `127.0.0.1`
   - **MYSQL_USER**: Usually `root`
   - **MYSQL_PASSWORD**: The password you set during installation
   - **MYSQL_DATABASE**: `dispatch1` or `dispatch` (the database you created)
   - **MYSQL_PORT**: Usually `3306`

### Option C: Check Existing .env or Config Files

Look for existing configuration files in your main project:
- Check `dispatchnewtemplate` folder for existing `.env` or `config.env`
- Look for database connection strings

---

## 3️⃣ Prisma DATABASE_URL

The `DATABASE_URL` format is:
```
mysql://username:password@host:port/database_name
```

**Example:**
```env
DATABASE_URL=mysql://root:yourpassword@localhost:3306/dispatch
```

**Build it from your MySQL credentials:**
- `username` = Your `MYSQL_USER` (usually `root`)
- `password` = Your `MYSQL_PASSWORD`
- `host` = Your `MYSQL_HOST` (usually `localhost`)
- `port` = Your `MYSQL_PORT` (usually `3306`)
- `database_name` = Your `MYSQL_DATABASE` (e.g., `dispatch` or `dispatch1`)

---

## 4️⃣ Complete .env File Template

Once you have all values, your `.env` file should look like this:

```env
# Shopify App Configuration
SHOPIFY_API_KEY=f39b70fd55542365c109655d5335793e
SHOPIFY_API_SECRET=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_APP_URL=https://pools-nicole-growing-divine.trycloudflare.com
SCOPES=read_orders,write_orders,read_products,write_products,read_metaobjects,write_metaobjects,read_metaobject_definitions,write_metaobject_definitions

# Database Configuration (Prisma)
DATABASE_URL=mysql://root:yourpassword@localhost:3306/dispatch

# MySQL Direct Connection (for dbMysl.js)
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=dispatch1
MYSQL_PORT=3306
MYSQL_CONNECTION_LIMIT=100

# Node Environment
NODE_ENV=development
```

---

## 🔍 Quick Checklist

Fill in these values in your `.env` file:

- [ ] **SHOPIFY_API_KEY** - From Shopify Partners Dashboard → App → API credentials → Client ID
- [ ] **SHOPIFY_API_SECRET** - From Shopify Partners Dashboard → App → API credentials → Client secret
- [ ] **SHOPIFY_APP_URL** - ✅ You already have this (Cloudflare tunnel URL)
- [ ] **MYSQL_HOST** - Usually `localhost`
- [ ] **MYSQL_USER** - Usually `root`
- [ ] **MYSQL_PASSWORD** - Your MySQL root password
- [ ] **MYSQL_DATABASE** - `dispatch1` or `dispatch` (the database name)
- [ ] **MYSQL_PORT** - Usually `3306`
- [ ] **DATABASE_URL** - Build from MySQL credentials: `mysql://user:password@host:port/database`

---

## 🆘 Troubleshooting

### Can't Find Shopify API Credentials?
- Make sure you're logged into Shopify Partners Dashboard
- Make sure you've created an app
- Check if you're looking at the correct app
- Try refreshing the page

### Don't Know MySQL Password?
- If you forgot, you can reset it
- Or check if you have it saved in another config file
- Check XAMPP/WAMP default password (usually empty or `root`)

### MySQL Not Running?
- Start MySQL service: `net start MySQL` (Windows)
- Or start XAMPP/WAMP control panel and start MySQL

### Database Doesn't Exist?
- Create it using: `CREATE DATABASE dispatch1;`
- Or use the database name from your main project

---

## 📝 Next Steps

Once you have all values:

1. **Update your `.env` file** with all the values
2. **Test database connection:**
   ```bash
   npm run test:db
   ```
3. **Run Prisma migrations:**
   ```bash
   npx prisma migrate dev
   ```
4. **Start the app:**
   ```bash
   npm run dev
   ```

---

**Need Help?** Check the main project's `.env` or `config.env` file for existing database credentials!

