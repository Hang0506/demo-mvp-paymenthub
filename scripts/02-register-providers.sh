#!/bin/bash

# Payment Hub MVP Demo - Register Providers
# Script 2: Cấu hình ZaloPay và MoMo providers

API_BASE="http://localhost:5000/api"

echo "🔧 Payment Hub MVP Demo - Register Providers"
echo "============================================"

# Step 1: Configure ZaloPay
echo ""
echo "💙 Step 1: Configuring ZaloPay Provider..."
ZALOPAY_RESPONSE=$(curl -s -X POST "$API_BASE/tenants/tenant-a/providers/ZALOPAY" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "merchantId": "merchant_zalopay_demo",
    "apiKey": "zalopay_demo_api_key_12345",
    "secretKey": "zalopay_demo_secret_67890",
    "callbackUrl": "http://localhost:5000/api/webhooks/zalopay",
    "returnUrl": "http://localhost:3000/payment/result"
  }')

echo "✅ ZaloPay configured:"
echo "$ZALOPAY_RESPONSE" | jq '.'

# Step 2: Configure MoMo
echo ""
echo "💖 Step 2: Configuring MoMo Provider..."
MOMO_RESPONSE=$(curl -s -X POST "$API_BASE/tenants/tenant-a/providers/MOMO" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "merchantId": "merchant_momo_demo",
    "apiKey": "momo_demo_api_key_abcde",
    "secretKey": "momo_demo_secret_fghij",
    "callbackUrl": "http://localhost:5000/api/webhooks/momo",
    "returnUrl": "http://localhost:3000/payment/result"
  }')

echo "✅ MoMo configured:"
echo "$MOMO_RESPONSE" | jq '.'

echo ""
echo "🎉 Provider configuration completed!"
echo "   - ZaloPay: Enabled"
echo "   - MoMo: Enabled"
echo "   - CASH: Always available (no config needed)"
echo ""
echo "Next: Run ./03-create-order.sh"