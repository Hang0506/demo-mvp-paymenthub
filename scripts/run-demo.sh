#!/bin/bash

# Payment Hub MVP Demo - Complete Demo Runner
# Runs all demo scripts in sequence

echo "🚀 Payment Hub MVP Demo - Complete Flow"
echo "======================================"
echo ""
echo "This demo will showcase all 8 Payment Hub capabilities:"
echo "1. ✅ Multi-tenant support"
echo "2. ✅ Payment method registration"
echo "3. ✅ Provider registration (ZaloPay, MoMo)"
echo "4. ✅ Provider configuration storage"
echo "5. ✅ Payment link generation"
echo "6. ✅ Payment page with registered methods"
echo "7. ✅ Split payment support"
echo "8. ✅ Webhook callback to tenant"
echo ""

read -p "Press Enter to start the demo..."

# Make scripts executable
chmod +x ./01-setup-tenant.sh
chmod +x ./02-register-providers.sh
chmod +x ./03-create-order.sh
chmod +x ./04-simulate-payment.sh
chmod +x ./05-verify-callback.sh

# Run demo scripts in sequence
echo ""
echo "🎬 Starting demo sequence..."
echo ""

# Step 1: Setup Tenant
./01-setup-tenant.sh
if [ $? -ne 0 ]; then
    echo "❌ Tenant setup failed!"
    exit 1
fi

echo ""
read -p "Press Enter to continue to provider configuration..."

# Step 2: Register Providers
./02-register-providers.sh
if [ $? -ne 0 ]; then
    echo "❌ Provider registration failed!"
    exit 1
fi

echo ""
read -p "Press Enter to continue to order creation..."

# Step 3: Create Order
ORDER_OUTPUT=$(./03-create-order.sh)
echo "$ORDER_OUTPUT"

if [ $? -ne 0 ]; then
    echo "❌ Order creation failed!"
    exit 1
fi

# Extract payment code from output
PAYMENT_CODE=$(echo "$ORDER_OUTPUT" | grep "Payment Code:" | awk '{print $4}')

echo ""
echo "🌐 Payment URL has been generated!"
echo "You can test the payment page manually, or continue with automated simulation."
echo ""
read -p "Press Enter to continue with automated payment simulation..."

# Step 4: Simulate Payment
./04-simulate-payment.sh "$PAYMENT_CODE"
if [ $? -ne 0 ]; then
    echo "❌ Payment simulation failed!"
    exit 1
fi

echo ""
read -p "Press Enter to verify final results..."

# Step 5: Verify Callback
./05-verify-callback.sh "$PAYMENT_CODE"

echo ""
echo "🎊 DEMO COMPLETED SUCCESSFULLY!"
echo ""
echo "📋 What was demonstrated:"
echo "   ✅ Multi-tenant architecture"
echo "   ✅ Dynamic payment method registration"
echo "   ✅ Provider adapter pattern (ZaloPay, MoMo, CASH)"
echo "   ✅ Secure configuration storage (KMS references)"
echo "   ✅ Payment link generation with QR code"
echo "   ✅ Responsive payment page"
echo "   ✅ Split payment functionality"
echo "   ✅ Webhook idempotency and tenant callbacks"
echo ""
echo "🎯 Ready for CTO presentation!"
echo ""
echo "Next steps:"
echo "   - Open http://localhost:3000/payment/$PAYMENT_CODE to see the payment page"
echo "   - Check Swagger UI at http://localhost:5000/swagger for API documentation"
echo "   - Review the code structure in mvp-demo/backend/ and mvp-demo/frontend/"