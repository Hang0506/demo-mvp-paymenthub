#!/bin/bash

# Payment Hub MVP Demo - Simulate Payment
# Script 4: Simulate split payment (CASH 50k + ZaloPay 100k)

API_BASE="http://localhost:5000/api"
PAYMENT_CODE=${1:-"PAY-20260427-001"}

echo "💸 Payment Hub MVP Demo - Simulate Payment"
echo "=========================================="
echo "Payment Code: $PAYMENT_CODE"

# Step 1: Submit Split Payment
echo ""
echo "🔄 Step 1: Submitting Split Payment (CASH 50k + ZaloPay 100k)..."
SUBMIT_RESPONSE=$(curl -s -X POST "$API_BASE/payments/$PAYMENT_CODE/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "splits": [
      {
        "methodId": "CASH",
        "amount": 50000
      },
      {
        "methodId": "ZALOPAY",
        "amount": 100000
      }
    ]
  }')

echo "✅ Payment submitted:"
echo "$SUBMIT_RESPONSE" | jq '.'

# Extract transaction ID and redirect URL
TRANSACTION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.transactionId')
REDIRECT_URL=$(echo "$SUBMIT_RESPONSE" | jq -r '.splits[] | select(.methodId == "ZALOPAY") | .redirectUrl')

echo ""
echo "📋 Payment Status:"
echo "   - Transaction ID: $TRANSACTION_ID"
echo "   - CASH: Completed immediately"
echo "   - ZaloPay: Pending (redirect required)"
echo "   - Redirect URL: $REDIRECT_URL"

# Step 2: Simulate ZaloPay Webhook
echo ""
echo "🔔 Step 2: Simulating ZaloPay Webhook..."
sleep 2

WEBHOOK_RESPONSE=$(curl -s -X POST "$API_BASE/webhooks/zalopay" \
  -H "Content-Type: application/json" \
  -d '{
    "app_id": "merchant_zalopay_demo",
    "app_trans_id": "SPLIT-002",
    "app_time": 1714176000000,
    "amount": 100000,
    "status": 1,
    "mac": "demo_signature_12345"
  }')

echo "✅ ZaloPay webhook processed:"
echo "$WEBHOOK_RESPONSE" | jq '.'

# Step 3: Check Final Payment Status
echo ""
echo "📊 Step 3: Checking Final Payment Status..."
sleep 1

STATUS_RESPONSE=$(curl -s -X GET "$API_BASE/payments/$PAYMENT_CODE/status")

echo "✅ Final payment status:"
echo "$STATUS_RESPONSE" | jq '.'

FINAL_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
PAID_AMOUNT=$(echo "$STATUS_RESPONSE" | jq -r '.paidAmount')

echo ""
echo "🎉 Payment Simulation Completed!"
echo "   - Final Status: $FINAL_STATUS"
echo "   - Paid Amount: $PAID_AMOUNT VND"
echo "   - CASH Split: ✅ Completed"
echo "   - ZaloPay Split: ✅ Completed"
echo ""
echo "Next: Run ./05-verify-callback.sh $PAYMENT_CODE"