# 🐳 Docker Rebuild Script for Payment Hub (PowerShell)
# This script rebuilds all Docker containers with the latest code changes

Write-Host "🐳 Payment Hub - Docker Rebuild Script" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop and clean up
Write-Host "📦 Step 1: Stopping and cleaning up old containers..." -ForegroundColor Yellow
docker-compose down -v
Write-Host "✅ Cleanup complete" -ForegroundColor Green
Write-Host ""

# Step 2: Remove old images (optional)
Write-Host "🗑️  Step 2: Removing old images..." -ForegroundColor Yellow
docker rmi payment-hub-api payment-hub-frontend payment-hub-mock-tenant 2>$null
Write-Host "✅ Old images removed" -ForegroundColor Green
Write-Host ""

# Step 3: Rebuild all services
Write-Host "🏗️  Step 3: Building all services (this may take a few minutes)..." -ForegroundColor Yellow
docker-compose build --no-cache
Write-Host "✅ Build complete" -ForegroundColor Green
Write-Host ""

# Step 4: Start all services
Write-Host "🚀 Step 4: Starting all services..." -ForegroundColor Yellow
docker-compose up -d
Write-Host "✅ Services started" -ForegroundColor Green
Write-Host ""

# Step 5: Wait for services to be healthy
Write-Host "⏳ Step 5: Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service status
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan
docker-compose ps
Write-Host ""

# Step 6: Test API endpoint
Write-Host "🧪 Step 6: Testing API endpoint..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/payment-tenants" -UseBasicParsing
    Write-Host "✅ API is responding!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Tenant list:" -ForegroundColor Cyan
    $response.Content | ConvertFrom-Json | ConvertTo-Json
} catch {
    Write-Host "⚠️  API is not responding yet. Check logs with: docker-compose logs api" -ForegroundColor Yellow
}
Write-Host ""

# Step 7: Test frontend
Write-Host "🧪 Step 7: Testing frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
    Write-Host "✅ Frontend is responding!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Frontend is not responding yet. Check logs with: docker-compose logs frontend" -ForegroundColor Yellow
}
Write-Host ""

# Final summary
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "🎉 Rebuild Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access Points:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:3000"
Write-Host "   Backend:   http://localhost:5000"
Write-Host "   Swagger:   http://localhost:5000/swagger"
Write-Host ""
Write-Host "🔍 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Open http://localhost:3000/portal/payment-methods"
Write-Host "   2. Check DevTools Network tab for GET /api/payment-tenants"
Write-Host "   3. Verify tenant dropdown shows dynamic data"
Write-Host "   4. Test payment input at http://localhost:3000/portal/test-payment"
Write-Host ""
Write-Host "📊 View logs: docker-compose logs -f" -ForegroundColor Yellow
Write-Host "🛑 Stop all:  docker-compose down" -ForegroundColor Yellow
Write-Host ""
