#!/bin/bash

# 🐳 Docker Rebuild Script for Payment Hub
# This script rebuilds all Docker containers with the latest code changes

set -e  # Exit on error

echo "🐳 Payment Hub - Docker Rebuild Script"
echo "======================================="
echo ""

# Step 1: Stop and clean up
echo "📦 Step 1: Stopping and cleaning up old containers..."
docker-compose down -v
echo "✅ Cleanup complete"
echo ""

# Step 2: Remove old images (optional)
echo "🗑️  Step 2: Removing old images..."
docker rmi payment-hub-api payment-hub-frontend payment-hub-mock-tenant 2>/dev/null || true
echo "✅ Old images removed"
echo ""

# Step 3: Rebuild all services
echo "🏗️  Step 3: Building all services (this may take a few minutes)..."
docker-compose build --no-cache
echo "✅ Build complete"
echo ""

# Step 4: Start all services
echo "🚀 Step 4: Starting all services..."
docker-compose up -d
echo "✅ Services started"
echo ""

# Step 5: Wait for services to be healthy
echo "⏳ Step 5: Waiting for services to be healthy..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""

# Step 6: Test API endpoint
echo "🧪 Step 6: Testing API endpoint..."
sleep 5
if curl -f http://localhost:5000/api/payment-tenants > /dev/null 2>&1; then
    echo "✅ API is responding!"
    echo ""
    echo "📋 Tenant list:"
    curl -s http://localhost:5000/api/payment-tenants | jq '.' || curl -s http://localhost:5000/api/payment-tenants
else
    echo "⚠️  API is not responding yet. Check logs with: docker-compose logs api"
fi
echo ""

# Step 7: Test frontend
echo "🧪 Step 7: Testing frontend..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is responding!"
else
    echo "⚠️  Frontend is not responding yet. Check logs with: docker-compose logs frontend"
fi
echo ""

# Final summary
echo "======================================="
echo "🎉 Rebuild Complete!"
echo ""
echo "📍 Access Points:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:5000"
echo "   Swagger:   http://localhost:5000/swagger"
echo ""
echo "🔍 Next Steps:"
echo "   1. Open http://localhost:3000/portal/payment-methods"
echo "   2. Check DevTools Network tab for GET /api/payment-tenants"
echo "   3. Verify tenant dropdown shows dynamic data"
echo "   4. Test payment input at http://localhost:3000/portal/test-payment"
echo ""
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop all:  docker-compose down"
echo ""
