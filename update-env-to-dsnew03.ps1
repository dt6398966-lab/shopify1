# Update .env file to use dsnew03 database

Write-Host "🔧 Updating .env file to use dsnew03 database..." -ForegroundColor Cyan

$envPath = ".\.env"

if (-not (Test-Path $envPath)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    exit 1
}

# Read current content
$content = Get-Content $envPath

# Update DATABASE_URL (handle with or without quotes)
$content = $content | ForEach-Object {
    if ($_ -match '^DATABASE_URL=') {
        # Remove quotes if present and update to dsnew03
        'DATABASE_URL=mysql://root:@127.0.0.1:3306/dsnew03'
    } elseif ($_ -match '^MYSQL_DATABASE=') {
        'MYSQL_DATABASE=dsnew03'
    } else {
        $_
    }
}

# Add MYSQL_DATABASE if it doesn't exist
if (-not ($content | Select-String -Pattern '^MYSQL_DATABASE=')) {
    # Find where to insert it (after DATABASE_URL or at end of MySQL section)
    $insertIndex = -1
    for ($i = 0; $i -lt $content.Length; $i++) {
        if ($content[$i] -match '^DATABASE_URL=') {
            $insertIndex = $i + 1
            break
        }
    }
    
    if ($insertIndex -ge 0) {
        $content = $content[0..($insertIndex-1)] + 'MYSQL_DATABASE=dsnew03' + $content[$insertIndex..($content.Length-1)]
    } else {
        $content += 'MYSQL_DATABASE=dsnew03'
    }
}

# Write back
$content | Set-Content $envPath

Write-Host "✅ .env file updated!" -ForegroundColor Green
Write-Host "`n📋 Updated values:" -ForegroundColor Cyan
Write-Host "   DATABASE_URL=mysql://root:@127.0.0.1:3306/dsnew03" -ForegroundColor White
Write-Host "   MYSQL_DATABASE=dsnew03" -ForegroundColor White

Write-Host "`n🚀 Now run: npx prisma migrate dev --name init_shopify_tables" -ForegroundColor Yellow

