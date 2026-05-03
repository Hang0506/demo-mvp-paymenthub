#!/bin/bash

# Payment Hub MVP Demo - Setup Tenant
# Script 1: Tạo tenant và đăng ký payment methods

API_BASE="http://localhost:5000/api"

echo "🚀 Payment Hub MVP Demo - Setup Tenant"
echo "======================================"

# Step 1: Create Tenant
echo ""
echo "📋 Step 1: Creating Tenant A..."
TENANT_RESPONSE=$(curl -s -X POST "$API_BASE/tenants" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-a",
    "tenantName": "Tenant A - Demo Company",
    "webhookUrl": "http://localhost:5001/webhook"
  }')

echo "✅ Tenant created:"
echo "$TENANT_RESPONSE" | jq '.'

# Step 2: Register Payment Methods
echo ""
echo "💳 Step 2: Registering Payment Methods..."
METHODS_RESPONSE=$(curl -s -X POST "$API_BASE/tenants/tenant-a/payment-methods" \
  -H "Content-Type: application/json" \
  -d '{
    "methods": [
      {
        "methodId": "CASH",
        "methodName": "Tiền mặt",
        "enabled": true
      },
      {
        "methodId": "ZALOPAY",
        "methodName": "ZaloPay",
        "enabled": true
      },
      {
        "methodId": "MOMO",
        "methodName": "MoMo",
        "enabled": true
      }
    ]
  }')

echo "✅ Payment methods registered:"
echo "$METHODS_RESPONSE" | jq '.'

echo ""
echo "🎉 Tenant setup completed successfully!"
echo "   - Tenant ID: tenant-a"
echo "   - Payment Methods: CASH, ZaloPay, MoMo"
echo ""
echo "Next: Run ./02-register-providers.sh"