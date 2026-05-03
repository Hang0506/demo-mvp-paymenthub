#!/bin/bash

# Payment Hub MVP Demo - Create Order
# Script 3: Tạo order 150k và generate payment link

API_BASE="http://localhost:5000/api"

echo "🛒 Payment Hub MVP Demo - Create Order"
echo "====================================="

# Step 1: Create Payment Request
echo ""
echo "💰 Step 1: Creating Payment Request (150,000 VND)..."
PAYMENT_RESPONSE=$(curl -s -X POST "$API_BASE/payments" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-a",
    "orderCode": "ORDER-DEMO-001",
    "amount": 150000,
    "currency": "VND",
    "customerInfo": {
      "name": "Nguyen Van A",
      "phone": "0901234567",
      "email": "nguyenvana@example.com"
    },
    "returnUrl": "http://localhost:3000/payment/result"
  }')

echo "✅ Payment request created:"
echo "$PAYMENT_RESPONSE" | jq '.'

# Extract payment code and URL
PAYMENT_CODE=$(echo "$PAYMENT_RESPONSE" | jq -r '.paymentRequestCode')
PAYMENT_URL=$(echo "$PAYMENT_RESPONSE" | jq -r '.paymentUrl')

echo ""
echo "📋 Payment Details:"
echo "   - Payment Code: $PAYMENT_CODE"
echo "   - Payment URL: $PAYMENT_URL"
echo "   - Amount: 150,000 VND"
echo "   - Customer: Nguyen Van A"

# Step 2: Get Available Payment Methods
echo ""
echo "💳 Step 2: Getting Available Payment Methods..."
METHODS_RESPONSE=$(curl -s -X GET "$API_BASE/payments/$PAYMENT_CODE/methods")

echo "✅ Available payment methods:"
echo "$METHODS_RESPONSE" | jq '.'

echo ""
echo "🎉 Order created successfully!"
echo ""
echo "🌐 Open this URL in browser to test payment:"
echo "   $PAYMENT_URL"
echo ""
echo "Or continue with automated testing:"
echo "   ./04-simulate-payment.sh $PAYMENT_CODE"