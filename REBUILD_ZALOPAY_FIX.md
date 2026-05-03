# Rebuild Docker Sau Khi Fix ZaloPay

## Tóm Tắt Thay Đổi

Đã implement ZaloPay integration để fix bug redirect URL:
- ✅ Tạo IZaloPayService interface và DTOs
- ✅ Implement MockZaloPayService với HMAC-SHA256 signature
- ✅ Update PaymentAppService để gọi ZaloPay API thay vì hardcode mock URL
- ✅ Thêm webhook endpoint `/api/payments/zalopay/callback`
- ✅ Register service trong DI container

## Bước 1: Stop Containers Hiện Tại

```powershell
cd mvp-demo
docker compose down
```

## Bước 2: Rebuild Backend Image

```powershell
# Rebuild chỉ backend service (nhanh hơn)
docker compose build api

# Hoặc rebuild tất cả (nếu cần)
docker compose build
```

## Bước 3: Start Lại Services

```powershell
docker compose up -d
```

## Bước 4: Kiểm Tra Services Đã Chạy

```powershell
docker compose ps
```

Expected output:
```
NAME                    STATUS              PORTS
mvp-demo-api-1          Up (healthy)        0.0.0.0:5000->5000/tcp
mvp-demo-frontend-1     Up                  0.0.0.0:3000->3000/tcp
mvp-demo-mock-tenant-1  Up                  0.0.0.0:5001->5001/tcp
mvp-demo-postgres-1     Up (healthy)        0.0.0.0:5432->5432/tcp
mvp-demo-redis-1        Up (healthy)        0.0.0.0:6379->6379/tcp
```

## Bước 5: Test ZaloPay Integration

### 5.1 Tạo Payment Mới

1. Vào Portal: http://localhost:3000/portal/test-payment
2. Chọn tenant đã có PTTT ZaloPay
3. Nhập amount: 100000
4. Click "Create Payment"
5. Copy payment link

### 5.2 Test ZaloPay Payment

1. Mở payment link (ví dụ: http://localhost:3000/payment/PAY-20260429-ABC123)
2. Chọn phương thức thanh toán: **ZaloPay** hoặc **Ví điện tử**
3. Nhập số tiền (nếu split payment)
4. Click "Thanh toán"

### 5.3 Verify Redirect URL

**TRƯỚC KHI FIX** (bug):
```
RedirectUrl: https://zalopay.vn/pay?token=demo_SPLIT-ABC123
```

**SAU KHI FIX** (correct):
```
RedirectUrl: https://sbgateway.zalopay.vn/api/getorderurl/a1b2c3d4e5f6...
```

### 5.4 Test Webhook (Optional)

Simulate ZaloPay callback:

```powershell
curl -X POST http://localhost:5000/api/payments/zalopay/callback `
  -H "Content-Type: application/json" `
  -d '{
    "Type": 1,
    "Mac": "test_mac_signature",
    "Data": "{\"AppId\":\"2553\",\"AppTransId\":\"260429_SPLIT-ABC123\",\"Amount\":100000,\"ZpTransId\":123456789}"
  }'
```

Expected response:
```json
{
  "return_code": 1,
  "return_message": "Success"
}
```

## Troubleshooting

### Issue 1: Build Failed

```powershell
# Clean build cache
docker compose build --no-cache api
```

### Issue 2: Container Not Starting

```powershell
# Check logs
docker compose logs api

# Check if port 5000 is in use
netstat -ano | findstr :5000
```

### Issue 3: Database Connection Error

```powershell
# Restart postgres
docker compose restart postgres

# Wait for postgres to be healthy
docker compose ps postgres
```

### Issue 4: Still Seeing Old Mock URL

Possible causes:
1. Browser cache → Hard refresh (Ctrl+Shift+R)
2. Old container still running → `docker compose down` then `docker compose up -d`
3. Build didn't include new code → `docker compose build --no-cache api`

## Verification Checklist

- [ ] Docker containers running (all 5 services)
- [ ] API healthy: http://localhost:5000/health
- [ ] Frontend accessible: http://localhost:3000
- [ ] Can create payment in Portal
- [ ] ZaloPay redirect URL starts with `https://sbgateway.zalopay.vn/api/getorderurl/`
- [ ] Webhook endpoint returns success

## Quick Rebuild Script

Nếu muốn rebuild nhanh:

```powershell
# Stop, rebuild backend, start
docker compose down
docker compose build api
docker compose up -d

# Wait for services to be ready
Start-Sleep -Seconds 10

# Check status
docker compose ps
```

## Estimated Time

- Stop containers: 5 seconds
- Rebuild backend: 30-60 seconds
- Start containers: 10-15 seconds
- **Total: ~1-2 minutes**
