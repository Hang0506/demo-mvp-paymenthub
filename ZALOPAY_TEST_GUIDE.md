# ZaloPay Integration - Testing Guide

## ✅ Implementation Status

**Tasks 1-5 COMPLETED:**
- ✅ Created IZaloPayService interface
- ✅ Created all DTOs (ZaloPayOrderRequest, ZaloPayOrderResponse, ZaloPayCallbackRequest)
- ✅ Implemented MockZaloPayService with HMAC-SHA256 signature
- ✅ Updated PaymentAppService to call ZaloPay API
- ✅ Added webhook endpoint `/api/payments/zalopay/callback`
- ✅ Registered service in DI container
- ✅ **FIXED URL FORMAT**: Corrected OrderUrl to `https://sb-openapi.zalopay.vn/order/token/{token}`
- ✅ **DOCKER REBUILT**: API container rebuilt and restarted with corrected code

## 🧪 How to Test

### Test 1: ZaloPay Payment Flow in Portal

1. **Open Portal Test Payment Page:**
   ```
   http://localhost:3000/portal/test-payment
   ```

2. **Create Test Payment:**
   - Select tenant from dropdown
   - Enter amount (e.g., 100000)
   - Click "Create Payment"
   - Copy the Payment Code (e.g., `PAY-20260429-XXXXXX`)

3. **Submit Payment with ZaloPay:**
   - Click "Submit Payment" button
   - Select "ZaloPay" as payment method
   - Click "Submit"

4. **Verify RedirectUrl Format:**
   - Check the response JSON
   - **EXPECTED**: `RedirectUrl` should be:
     ```
     https://sb-openapi.zalopay.vn/order/token/{zp_trans_token}
     ```
   - **NOT**: `https://zalopay.vn/pay?token=demo_SPLIT-XXXXXX` (old mock URL)

5. **Example Expected Response:**
   ```json
   {
     "PaymentCode": "PAY-20260429-XXXXXX",
     "TotalAmount": 100000,
     "State": "Pending",
     "Splits": [
       {
         "SplitCode": "SPLIT-XXXXXX",
         "Amount": 100000,
         "MethodId": "ZALOPAY",
         "ProviderId": "ZALOPAY",
         "State": "Pending",
         "RedirectUrl": "https://sb-openapi.zalopay.vn/order/token/abc123def456...",
         "ProviderOrderId": "abc123def456..."
       }
     ]
   }
   ```

### Test 2: Direct API Call

You can also test via direct API call:

```bash
# 1. Create payment
curl -X POST http://localhost:5000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "TenantId": "tenant-001",
    "OrderCode": "ORDER-TEST-001",
    "TotalAmount": 100000,
    "Description": "Test ZaloPay payment"
  }'

# 2. Submit payment with ZaloPay
curl -X POST http://localhost:5000/api/payments/{paymentCode}/submit \
  -H "Content-Type: application/json" \
  -d '{
    "Splits": [
      {
        "MethodId": "ZALOPAY",
        "Amount": 100000
      }
    ]
  }'
```

### Test 3: Verify Webhook Endpoint Exists

```bash
# Test webhook endpoint (should return 400 or validation error, not 404)
curl -X POST http://localhost:5000/api/payments/zalopay/callback \
  -H "Content-Type: application/json" \
  -d '{
    "Type": 1,
    "Mac": "test",
    "Data": "{}"
  }'
```

**Expected**: Response should NOT be 404 Not Found (endpoint exists now)

## ✅ Success Criteria

- [ ] RedirectUrl format is `https://sb-openapi.zalopay.vn/order/token/{token}` (NOT `https://zalopay.vn/pay?token=demo_...`)
- [ ] ProviderOrderId is populated with zp_trans_token
- [ ] Webhook endpoint `/api/payments/zalopay/callback` exists (not 404)
- [ ] Other payment methods (CASH, MOMO, VNPAY) still work as before

## 🐛 If Test Fails

If you still see the old mock URL format:

1. **Check API container logs:**
   ```bash
   docker compose logs api --tail=50
   ```

2. **Verify API container is using new image:**
   ```bash
   docker compose ps
   # Check "STATUS" column - should show "Up X seconds" (recently restarted)
   ```

3. **Force rebuild if needed:**
   ```bash
   docker compose down
   docker compose build --no-cache api
   docker compose up -d
   ```

## 📋 Next Steps After Testing

Once testing passes:

1. **Tasks 6-10 remain** (write tests):
   - Task 6: Bug condition exploration tests
   - Task 7: Fix verification tests
   - Task 8: Preservation tests
   - Task 9: Integration tests
   - Task 10: Documentation

2. **Run tests:**
   ```bash
   cd mvp-demo/backend
   dotnet test
   ```

## 📝 Notes

- This is a **mock implementation** - no real ZaloPay credentials needed
- OrderUrl is simulated but follows correct ZaloPay API pattern
- Webhook callback handling is implemented but not fully tested yet
- MAC signature generation follows HMAC-SHA256 standard
