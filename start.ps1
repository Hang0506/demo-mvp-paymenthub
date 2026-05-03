#!/usr/bin/env pwsh
# Payment Hub MVP Demo - Start Script (Windows PowerShell)

Write-Host "🚀 Payment Hub MVP Demo" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

# Check Docker
Write-Host "`n🔍 Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Docker not running" }
    Write-Host "✅ Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Desktop is not running!" -ForegroundColor Red
    Write-Host "   Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

# Navigate to mvp-demo directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "`n🏗️  Building and starting all services..." -ForegroundColor Yellow
Write-Host "   This may take 3-5 minutes on first run (downloading images + building)" -ForegroundColor Gray

# Build and start
docker compose up --build -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Failed to start services!" -ForegroundColor Red
    docker compose logs --tail=20
    exit 1
}

Write-Host "`n⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check health
Write-Host "`n🔍 Checking service health..." -ForegroundColor Yellow

$services = @(
    @{ Name = "PostgreSQL";    Url = $null;                          Container = "payment-hub-postgres" },
    @{ Name = "API Backend";   Url = "http://localhost:5000/swagger"; Container = "payment-hub-api" },
    @{ Name = "Frontend";      Url = "http://localhost:3000";         Container = "payment-hub-frontend" },
    @{ Name = "Mock Tenant";   Url = "http://localhost:5001/health";  Container = "payment-hub-mock-tenant" }
)

foreach ($svc in $services) {
    $status = docker inspect --format='{{.State.Status}}' $svc.Container 2>&1
    if ($status -eq "running") {
        Write-Host "  ✅ $($svc.Name): running" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $($svc.Name): $status" -ForegroundColor Yellow
    }
}

Write-Host "`n🎉 Payment Hub MVP Demo is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Access Points:" -ForegroundColor Cyan
Write-Host "  🌐 Frontend (Payment Page): http://localhost:3000" -ForegroundColor White
Write-Host "  📡 API + Swagger UI:        http://localhost:5000/swagger" -ForegroundColor White
Write-Host "  🔔 Mock Tenant Backend:     http://localhost:5001" -ForegroundColor White
Write-Host "  🗄️  PostgreSQL:              localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "🎬 Run Demo:" -ForegroundColor Cyan
Write-Host "  Option 1: Open http://localhost:5000/swagger and test APIs manually" -ForegroundColor White
Write-Host "  Option 2: Run .\scripts\run-demo.ps1 for automated demo" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop: docker compose down" -ForegroundColor Gray