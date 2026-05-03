# reset-demo.ps1 — Xóa toàn bộ data để demo lại từ đầu (Windows)

Write-Host "🗑️  Clearing demo data..." -ForegroundColor Yellow

$sqlFile = Join-Path $PSScriptRoot "reset-demo.sql"
Get-Content $sqlFile | docker exec -i payment-hub-postgres psql -U postgres -d PaymentHubDb

Write-Host ""
Write-Host "✅ Done! Bây giờ chạy lại demo:" -ForegroundColor Green
Write-Host "   .\scripts\01-setup-tenant.sh"
Write-Host "   .\scripts\02-register-providers.sh"
Write-Host "   .\scripts\03-create-order.sh"
