# PowerShell script to setup dsnew03 database

Write-Host "🔧 Setting up dsnew03 database for Shopify app..." -ForegroundColor Cyan

# Step 1: Check if .env file exists
$envPath = ".\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file first. See ENV_TEMPLATE.txt" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ .env file found" -ForegroundColor Green

# Step 2: Update .env file to use dsnew03
Write-Host "`n📝 Updating .env file to use dsnew03..." -ForegroundColor Cyan

$envContent = Get-Content $envPath -Raw

# Update DATABASE_URL
$envContent = $envContent -replace 'DATABASE_URL=mysql://[^`n]+', 'DATABASE_URL=mysql://root:@127.0.0.1:3306/dsnew03'

# Update MYSQL_DATABASE
$envContent = $envContent -replace 'MYSQL_DATABASE=[^`n]+', 'MYSQL_DATABASE=dsnew03'

Set-Content -Path $envPath -Value $envContent -NoNewline

Write-Host "✅ .env file updated" -ForegroundColor Green

# Step 3: Run Prisma migration
Write-Host "`n🚀 Running Prisma migration..." -ForegroundColor Cyan
Write-Host "This will create tables in dsnew03 database" -ForegroundColor Yellow

npx prisma migrate dev --name init_shopify_tables

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host "`n📊 Tables created in dsnew03:" -ForegroundColor Cyan
    Write-Host "   - Session" -ForegroundColor White
    Write-Host "   - OrderEvent" -ForegroundColor White
    Write-Host "   - User" -ForegroundColor White
    Write-Host "   - WebhookConfig" -ForegroundColor White
    Write-Host "`n✅ You can now restart your app with: shopify app dev" -ForegroundColor Green
} else {
    Write-Host "`n❌ Migration failed. Please check the error above." -ForegroundColor Red
}

