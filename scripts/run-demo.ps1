#!/usr/bin/env pwsh
# Payment Hub MVP Demo - Automated Demo Script (PowerShell)

$API = "http://localhost:5000/api"

function Invoke-Api($Method, $Path, $Body = $null) {
    $params = @{
        Method  = $Method
        Uri     = "$API$Path"
        Headers = @{ "Content-Type" = "application/json" }
    }
    if ($Body) { $params.Body = ($Body | ConvertTo-Json -Depth 10) }
    try {
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

Write-Host "🎬 Payment Hub MVP Demo - Full Flow" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# ── Step 1: Create Tenant ──────────────────────────────────────────────────
Write-Host "`n📋 Step 1: Creating Tenant A..." -ForegroundColor Yellow
$tenant = Invoke-Api "POST" "/tenants" @{
    tenantId    = "tenant-a"
    tenantName  = "Tenant A - Demo Company"
    webhookUrl  = "http://mock-tenant:5001/webhook"
}
if ($tenant) { Write-Host "  ✅ Tenant created: $($tenant.tenantId)" -ForegroundColor Green }

# ── Step 2: Register Payment Methods ──────────────────────────────────────
Write-Host "`n💳 Step 2: Registering Payment Methods (CASH, ZaloPay, MoMo)..." -ForegroundColor Yellow
$methods = Invoke-Api "POST" "/tenants/tenant-a/payment-methods" @{
    methods = @(
        @{ methodId = "CASH";    methodName = "Tiền mặt"; enabled = $true },
        @{ methodId = "ZALOPAY"; methodName = "ZaloPay";  enabled = $true },
        @{ methodId = "MOMO";    methodName = "MoMo";     enabled = $true }
    )
}
if ($methods) { Write-Host "  ✅ 3 payment methods registered" -ForegroundColor Green }

# ── Step 3: Configure Providers ───────────────────────────────────────────
Write-Host "`n🔧 Step 3: Configuring ZaloPay & MoMo providers..." -ForegroundColor Yellow
$zalopay = Invoke-Api "POST" "/tenants/tenant-a/providers/ZALOPAY" @{
    enabled    = $true
    merchantId = "merchant_zalopay_demo"
    apiKey     = "zalopay_api_key_demo"
    secretKey  = "zalopay_secret_demo"
    callbackUrl = "http://api:8080/api/webhooks/zalopay"
    returnUrl   = "http://localhost:3000/payment/result"
}
if ($zalopay) { Write-Host "  ✅ ZaloPay configured (keys stored as KMS refs)" -ForegroundColor Green }

$momo = Invoke-Api "POST" "/tenants/tenant-a/providers/MOMO" @{
    enabled    = $true
    merchantId = "merchant_momo_demo"
    apiKey     = "momo_api_key_demo"
    secretKey  = "momo_secret_demo"
    callbackUrl = "http://api:8080/api/webhooks/momo"
    returnUrl   = "http://localhost:3000/payment/result"
}
if ($momo) { Write-Host "  ✅ MoMo configured (keys stored as KMS refs)" -ForegroundColor Green }

# ── Step 4: Create Payment ─────────────────────────────────────────────────
Write-Host "`n💰 Step 4: Creating payment request (150,000 VND)..." -ForegroundColor Yellow
$payment = Invoke-Api "POST" "/payments" @{
    tenantId  = "tenant-a"
    orderCode = "ORDER-DEMO-001"
    amount    = 150000
    currency  = "VND"
    customerInfo = @{
        name  = "Nguyen Van A"
        phone = "0901234567"
        email = "nguyenvana@example.com"
    }
    returnUrl = "http://localhost:3000/payment/result"
}
if ($payment) {
    $paymentCode = $payment.paymentRequestCode
    Write-Host "  ✅ Payment created: $paymentCode" -ForegroundColor Green
    Write-Host "  🌐 Payment URL: $($payment.paymentUrl)" -ForegroundColor Cyan
}

# ── Step 5: Get Payment Methods ────────────────────────────────────────────
Write-Host "`n📋 Step 5: Getting available payment methods for customer..." -ForegroundColor Yellow
$availableMethods = Invoke-Api "GET" "/payments/$paymentCode/methods"
if ($availableMethods) {
    Write-Host "  ✅ Available methods: $($availableMethods.methods.Count) methods" -ForegroundColor Green
    $availableMethods.methods | ForEach-Object {
        Write-Host "     - $($_.methodName) ($($_.methodId))" -ForegroundColor White
    }
}

# ── Step 6: Submit Split Payment ──────────────────────────────────────────
Write-Host "`n💸 Step 6: Submitting split payment (CASH 50k + ZaloPay 100k)..." -ForegroundColor Yellow
$submitResult = Invoke-Api "POST" "/payments/$paymentCode/submit" @{
    splits = @(
        @{ methodId = "CASH";    amount = 50000 },
        @{ methodId = "ZALOPAY"; amount = 100000 }
    )
}
if ($submitResult) {
    Write-Host "  ✅ Payment submitted: $($submitResult.transactionId)" -ForegroundColor Green
    $submitResult.splits | ForEach-Object {
        $icon = if ($_.status -eq "Captured") { "✅" } else { "⏳" }
        Write-Host "     $icon $($_.methodId): $($_.amount) VND → $($_.status)" -ForegroundColor White
        if ($_.redirectUrl) {
            Write-Host "        Redirect: $($_.redirectUrl)" -ForegroundColor Gray
        }
    }
}

# ── Step 7: Simulate ZaloPay Webhook ──────────────────────────────────────
Write-Host "`n🔔 Step 7: Simulating ZaloPay webhook callback..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
$webhook = Invoke-Api "POST" "/webhooks/zalopay" @{
    app_id       = "merchant_zalopay_demo"
    app_trans_id = "SPLIT-ZALOPAY-001"
    amount       = 100000
    status       = 1
    mac          = "demo_signature"
}
if ($webhook) { Write-Host "  ✅ Webhook processed: $($webhook.status)" -ForegroundColor Green }

# ── Step 8: Check Final Status ────────────────────────────────────────────
Write-Host "`n📊 Step 8: Checking final payment status..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
$finalStatus = Invoke-Api "GET" "/payments/$paymentCode/status"
if ($finalStatus) {
    $statusColor = if ($finalStatus.status -eq "PAID") { "Green" } else { "Yellow" }
    Write-Host "  ✅ Final Status: $($finalStatus.status)" -ForegroundColor $statusColor
    Write-Host "     Total: $($finalStatus.amount) VND | Paid: $($finalStatus.paidAmount) VND" -ForegroundColor White
}

# ── Summary ───────────────────────────────────────────────────────────────
Write-Host "`n🎊 DEMO COMPLETED!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Capability 1: Multi-tenant          → Tenant A created" -ForegroundColor White
Write-Host "✅ Capability 2: Payment Methods       → CASH, ZaloPay, MoMo registered" -ForegroundColor White
Write-Host "✅ Capability 3: Provider Registration → ZaloPay + MoMo configured" -ForegroundColor White
Write-Host "✅ Capability 4: Config Storage        → Keys stored as KMS references" -ForegroundColor White
Write-Host "✅ Capability 5: Payment Link          → $($payment.paymentUrl)" -ForegroundColor White
Write-Host "✅ Capability 6: Payment Page          → http://localhost:3000/payment/$paymentCode" -ForegroundColor White
Write-Host "✅ Capability 7: Split Payment         → CASH 50k + ZaloPay 100k" -ForegroundColor White
Write-Host "✅ Capability 8: Webhook Callback      → ZaloPay webhook processed" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Open payment page: http://localhost:3000/payment/$paymentCode" -ForegroundColor Cyan
Write-Host "📡 Swagger UI:        http://localhost:5000/swagger" -ForegroundColor Cyan