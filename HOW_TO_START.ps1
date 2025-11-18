# ============================================
# HOW TO START SHOPIFY APP
# ============================================

Write-Host "🚀 Starting Shopify App..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Navigate to project directory
$projectPath = "C:\Users\Admin\Downloads\shopify-app-completed-1\shopify-app-old-without-start-authentication\shopify-app\dispatch-logistics-connector"
Set-Location $projectPath

Write-Host "✅ Step 1: Changed to project directory" -ForegroundColor Green
Write-Host "   Path: $projectPath" -ForegroundColor Gray
Write-Host ""

# Step 2: Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Warning: .env file not found!" -ForegroundColor Yellow
    Write-Host "   Make sure you have configured your environment variables." -ForegroundColor Yellow
    Write-Host ""
}

# Step 3: Generate Prisma Client (if needed)
Write-Host "📋 Step 2: Checking Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma Client ready" -ForegroundColor Green
} else {
    Write-Host "⚠️  Prisma generate had issues, but continuing..." -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Start the app
Write-Host "🚀 Step 3: Starting Shopify app..." -ForegroundColor Yellow
Write-Host "   This will:" -ForegroundColor Gray
Write-Host "   - Create a Cloudflare tunnel" -ForegroundColor Gray
Write-Host "   - Start the development server" -ForegroundColor Gray
Write-Host "   - Open the app in your browser" -ForegroundColor Gray
Write-Host ""
Write-Host "   Look for the Cloudflare URL in the output!" -ForegroundColor Cyan
Write-Host ""

shopify app dev

