# Fix Prisma Baseline Error (P3005)
# This script creates Prisma tables and marks migration as applied

Write-Host "🔧 Fixing Prisma Baseline Error..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if SQL script exists
$sqlScript = "create-prisma-tables.sql"
if (-not (Test-Path $sqlScript)) {
    Write-Host "❌ SQL script not found: $sqlScript" -ForegroundColor Red
    Write-Host "Please make sure create-prisma-tables.sql exists in the current directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Step 1: SQL script found" -ForegroundColor Green

# Step 2: Get migration name
$migrationsPath = "prisma\migrations"
if (-not (Test-Path $migrationsPath)) {
    Write-Host "❌ Migrations folder not found: $migrationsPath" -ForegroundColor Red
    exit 1
}

$migrationDirs = Get-ChildItem $migrationsPath -Directory
if ($migrationDirs.Count -eq 0) {
    Write-Host "❌ No migrations found" -ForegroundColor Red
    exit 1
}

$migrationName = $migrationDirs[0].Name
Write-Host "✅ Step 2: Found migration: $migrationName" -ForegroundColor Green

# Step 3: Prompt user to run SQL script
Write-Host ""
Write-Host "📋 Step 3: Create Prisma tables" -ForegroundColor Yellow
Write-Host "Please run the SQL script to create tables:" -ForegroundColor White
Write-Host ""
Write-Host "   Option 1: MySQL Command Line" -ForegroundColor Cyan
Write-Host "   mysql -u root -p dsnew03 < create-prisma-tables.sql" -ForegroundColor White
Write-Host ""
Write-Host "   Option 2: MySQL Workbench" -ForegroundColor Cyan
Write-Host "   1. Open MySQL Workbench" -ForegroundColor White
Write-Host "   2. Connect to server" -ForegroundColor White
Write-Host "   3. Select dsnew03 database" -ForegroundColor White
Write-Host "   4. File → Open SQL Script → create-prisma-tables.sql" -ForegroundColor White
Write-Host "   5. Click Execute" -ForegroundColor White
Write-Host ""
Write-Host "   Option 3: phpMyAdmin" -ForegroundColor Cyan
Write-Host "   1. Open phpMyAdmin" -ForegroundColor White
Write-Host "   2. Select dsnew03 database" -ForegroundColor White
Write-Host "   3. Click SQL tab" -ForegroundColor White
Write-Host "   4. Paste contents of create-prisma-tables.sql" -ForegroundColor White
Write-Host "   5. Click Go" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Have you run the SQL script? (y/n)"
if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host "Please run the SQL script first, then run this script again." -ForegroundColor Yellow
    exit 0
}

# Step 4: Mark migration as applied
Write-Host ""
Write-Host "✅ Step 4: Marking migration as applied..." -ForegroundColor Yellow
Write-Host "Running: npx prisma migrate resolve --applied $migrationName" -ForegroundColor Cyan

npx prisma migrate resolve --applied $migrationName

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration marked as applied!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Step 5: You can now restart your app:" -ForegroundColor Yellow
    Write-Host "   shopify app dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✅ All done! The app should now work without Prisma errors." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Failed to mark migration as applied" -ForegroundColor Red
    Write-Host "Please check the error above and try again." -ForegroundColor Yellow
    exit 1
}

