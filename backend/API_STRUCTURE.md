# Payment Hub API Structure

> Simplified .NET 8 implementation for MVP demo

---

## Project Structure

```
PaymentHub.sln
├── src/
│   ├── PaymentHub.Api/              # Web API layer
│   │   ├── Controllers/
│   │   │   ├── TenantsController.cs
│   │   │   ├── PaymentsController.cs
│   │   │   └── WebhooksController.cs
│   │   ├── Program.cs
│   │   └── appsettings.json
│   │
│   ├── PaymentHub.Core/             # Domain layer
│   │   ├── Entities/
│   │   │   ├── Tenant.cs
│   │   │   ├── Transaction.cs
│   │   │   ├── PaymentSplit.cs
│   │   │   └── TransactionEvent.cs
│   │   ├── Interfaces/
│   │   │   ├── IPaymentProviderAdapter.cs
│   │   │   ├── IPaymentOrchestrator.cs
│   │   │   └── ITenantNotifier.cs
│   │   ├── Services/
│   │   │   ├── PaymentOrchestrator.cs
│   │   │   └── TenantNotifier.cs
│   │   └── ValueObjects/
│   │       ├── TransactionState.cs
│   │       └── PaymentMethod.cs
│   │
│   ├── PaymentHub.Infrastructure/   # Infrastructure layer
│   │   ├── Data/
│   │   │   ├── PaymentHubDbContext.cs
│   │   │   └── Repositories/
│   │   ├── Idempotency/
│   │   │   ├── InboxService.cs
│   │   │   └── OutboxService.cs
│   │   └── EventBus/
│   │       └── KafkaEventBus.cs
│   │
│   └── PaymentHub.Providers/        # Provider adapters
│       ├── ZaloPayAdapter.cs
│       ├── MoMoAdapter.cs
│       └── CashAdapter.cs
│
└── tests/
    └── PaymentHub.Tests/
        ├── Unit/
        └── Integration/
```

---

## Key Interfaces

### IPaymentProviderAdapter

```csharp
public interface IPaymentProviderAdapter
{
    string ProviderId { get; }
    string ProviderName { get; }
    
    Task<CreateOrderResult> CreateOrder(CreateOrderCommand command);
    Task<QueryOrderResult> QueryOrder(string providerOrderId);
    Task<WebhookVerificationResult> VerifyWebhook(HttpRequest request);
    Task<NormalizedCallbackData> ParseCallback(HttpRequest request);
    TransactionState MapProviderStatus(string providerStatus);
}
```

### IPaymentOrchestrator

```csharp
public interface IPaymentOrchestrator
{
    Task<PaymentResult> InitiatePayment(PaymentContext context);
    Task<CallbackResult> HandleProviderCallback(ProviderCallbackEvent callbackEvent);
    Task<PaymentState> GetPaymentState(string paymentRequestCode);
}
```

### ITenantNotifier

```csharp
public interface ITenantNotifier
{
    Task<NotifyResult> NotifyTenant(TenantNotification notification);
    Task RetryPendingNotifications();
}
```

---

## API Endpoints

### Tenant Management

```csharp
// POST /api/tenants
[HttpPost]
public async Task<IActionResult> CreateTenant([FromBody] CreateTenantRequest request)
{
    var tenant = new Tenant
    {
        TenantId = request.TenantId,
        TenantName = request.TenantName,
        WebhookUrl = request.WebhookUrl,
        Enabled = true
    };
    
    await _dbContext.Tenants.AddAsync(tenant);
    await _dbContext.SaveChangesAsync();
    
    return Ok(new { tenant.TenantId, tenant.TenantName });
}

// POST /api/tenants/{tenantId}/payment-methods
[HttpPost("{tenantId}/payment-methods")]
public async Task<IActionResult> RegisterPaymentMethods(
    string tenantId,
    [FromBody] RegisterPaymentMethodsRequest request)
{
    foreach (var method in request.Methods)
    {
        var paymentMethod = new PaymentMethod
        {
            TenantId = tenantId,
            MethodId = method.MethodId,
            MethodName = method.MethodName,
            Enabled = method.Enabled
        };
        
        await _dbContext.PaymentMethods.AddAsync(paymentMethod);
    }
    
    await _dbContext.SaveChangesAsync();
    
    return Ok(new { Methods = request.Methods });
}

// POST /api/tenants/{tenantId}/providers/{providerId}
[HttpPost("{tenantId}/providers/{providerId}")]
public async Task<IActionResult> ConfigureProvider(
    string tenantId,
    string providerId,
    [FromBody] ConfigureProviderRequest request)
{
    var config = new ProviderConfig
    {
        TenantId = tenantId,
        ProviderId = providerId,
        Enabled = request.Enabled,
        MerchantId = request.MerchantId,
        ApiKeyRef = $"kms://{providerId}/api_key", // Store in KMS
        SecretKeyRef = $"kms://{providerId}/secret", // Store in KMS
        CallbackUrl = request.CallbackUrl,
        ReturnUrl = request.ReturnUrl
    };
    
    await _dbContext.ProviderConfigs.AddAsync(config);
    await _dbContext.SaveChangesAsync();
    
    return Ok(new { config.ProviderId, config.Enabled });
}
```

### Payment Operations

```csharp
// POST /api/payments
[HttpPost]
public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentRequest request)
{
    var paymentCode = $"PAY-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N[..6]}";
    
    var transaction = new Transaction
    {
        TransactionCode = $"TXN-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N[..6]}",
        PaymentRequestCode = paymentCode,
        TenantId = request.TenantId,
        OrderCode = request.OrderCode,
        Amount = request.Amount,
        Currency = request.Currency,
        State = TransactionState.Created,
        CustomerInfo = JsonSerializer.Serialize(request.CustomerInfo)
    };
    
    await _dbContext.Transactions.AddAsync(transaction);
    await _dbContext.SaveChangesAsync();
    
    var paymentUrl = $"{_config["PaymentPageUrl"]}/payment/{paymentCode}";
    
    return Ok(new
    {
        PaymentRequestCode = paymentCode,
        PaymentUrl = paymentUrl,
        QrCode = GenerateQrCode(paymentUrl)
    });
}

// GET /api/payments/{paymentCode}/methods
[HttpGet("{paymentCode}/methods")]
public async Task<IActionResult> GetPaymentMethods(string paymentCode)
{
    var transaction = await _dbContext.Transactions
        .FirstOrDefaultAsync(t => t.PaymentRequestCode == paymentCode);
    
    if (transaction == null)
        return NotFound();
    
    var methods = await _dbContext.PaymentMethods
        .Where(m => m.TenantId == transaction.TenantId && m.Enabled)
        .OrderBy(m => m.DisplayOrder)
        .ToListAsync();
    
    return Ok(new
    {
        PaymentRequestCode = paymentCode,
        Amount = transaction.Amount,
        Currency = transaction.Currency,
        Methods = methods.Select(m => new
        {
            m.MethodId,
            m.MethodName,
            m.IconUrl,
            m.Enabled
        })
    });
}

// POST /api/payments/{paymentCode}/submit
[HttpPost("{paymentCode}/submit")]
public async Task<IActionResult> SubmitPayment(
    string paymentCode,
    [FromBody] SubmitPaymentRequest request)
{
    var transaction = await _dbContext.Transactions
        .FirstOrDefaultAsync(t => t.PaymentRequestCode == paymentCode);
    
    if (transaction == null)
        return NotFound();
    
    // Validate split amounts
    var totalSplitAmount = request.Splits.Sum(s => s.Amount);
    if (totalSplitAmount != transaction.Amount)
        return BadRequest("Split amounts must equal total amount");
    
    var splits = new List<PaymentSplit>();
    
    foreach (var splitRequest in request.Splits)
    {
        var split = new PaymentSplit
        {
            SplitCode = $"SPLIT-{Guid.NewGuid():N[..6]}",
            TransactionId = transaction.Id,
            MethodId = splitRequest.MethodId,
            Amount = splitRequest.Amount,
            State = TransactionState.Created
        };
        
        // Process based on method
        if (splitRequest.MethodId == "CASH")
        {
            // CASH is instant
            split.State = TransactionState.Captured;
            split.CompletedAt = DateTime.UtcNow;
        }
        else
        {
            // Provider payment - create order
            var adapter = _providerRegistry.GetAdapter(splitRequest.MethodId);
            var orderResult = await adapter.CreateOrder(new CreateOrderCommand
            {
                Amount = split.Amount,
                OrderCode = transaction.OrderCode,
                ReturnUrl = _config["ReturnUrl"]
            });
            
            split.ProviderId = splitRequest.MethodId;
            split.ProviderOrderId = orderResult.OrderId;
            split.RedirectUrl = orderResult.PaymentUrl;
            split.State = TransactionState.PendingAuthorize;
        }
        
        splits.Add(split);
        await _dbContext.PaymentSplits.AddAsync(split);
    }
    
    await _dbContext.SaveChangesAsync();
    
    return Ok(new
    {
        TransactionId = transaction.TransactionCode,
        Status = transaction.State.ToString(),
        Splits = splits.Select(s => new
        {
            s.SplitCode,
            s.MethodId,
            s.Amount,
            Status = s.State.ToString(),
            s.RedirectUrl
        })
    });
}

// GET /api/payments/{paymentCode}/status
[HttpGet("{paymentCode}/status")]
public async Task<IActionResult> GetPaymentStatus(string paymentCode)
{
    var transaction = await _dbContext.Transactions
        .Include(t => t.Splits)
        .FirstOrDefaultAsync(t => t.PaymentRequestCode == paymentCode);
    
    if (transaction == null)
        return NotFound();
    
    // Determine overall status
    var allCaptured = transaction.Splits.All(s => s.State == TransactionState.Captured);
    var anyFailed = transaction.Splits.Any(s => s.State == TransactionState.Failed);
    
    var status = allCaptured ? "PAID" :
                 anyFailed ? "FAILED" :
                 "PENDING";
    
    return Ok(new
    {
        PaymentRequestCode = paymentCode,
        Status = status,
        Amount = transaction.Amount,
        PaidAmount = transaction.Splits
            .Where(s => s.State == TransactionState.Captured)
            .Sum(s => s.Amount),
        Splits = transaction.Splits.Select(s => new
        {
            s.SplitCode,
            s.MethodId,
            s.Amount,
            Status = s.State.ToString(),
            s.ProviderTransactionId
        })
    });
}
```

### Webhook Handling

```csharp
// POST /api/webhooks/{providerId}
[HttpPost("{providerId}")]
public async Task<IActionResult> ReceiveWebhook(string providerId)
{
    // Read raw body
    using var reader = new StreamReader(Request.Body);
    var rawBody = await reader.ReadToEndAsync();
    
    // Get adapter
    var adapter = _providerRegistry.GetAdapter(providerId);
    
    // Verify webhook
    var verification = await adapter.VerifyWebhook(Request);
    if (!verification.IsValid)
        return BadRequest("Invalid signature");
    
    // Parse callback data
    var callbackData = await adapter.ParseCallback(Request);
    
    // Generate idempotency key
    var idempotencyKey = $"{providerId}|{callbackData.ProviderTransactionId}";
    var keyHash = ComputeSha256(idempotencyKey);
    
    // Check inbox (idempotency)
    var existing = await _dbContext.Inbox
        .FirstOrDefaultAsync(i => i.IdempotencyKey == keyHash);
    
    if (existing != null)
    {
        // Already processed
        return Ok(new { Status = "Already processed" });
    }
    
    // Store in inbox
    var inboxEntry = new InboxEntry
    {
        IdempotencyKey = keyHash,
        MessageType = "ProviderWebhook",
        MessageData = rawBody,
        ExpiresAt = DateTime.UtcNow.AddHours(24)
    };
    
    await _dbContext.Inbox.AddAsync(inboxEntry);
    
    // Find split by provider transaction ID
    var split = await _dbContext.PaymentSplits
        .Include(s => s.Transaction)
        .FirstOrDefaultAsync(s => s.ProviderOrderId == callbackData.ProviderOrderId);
    
    if (split != null)
    {
        // Update split state
        var newState = adapter.MapProviderStatus(callbackData.Status);
        split.State = newState;
        split.ProviderTransactionId = callbackData.ProviderTransactionId;
        
        if (newState == TransactionState.Captured)
        {
            split.CompletedAt = DateTime.UtcNow;
            
            // Check if all splits are captured
            var allSplits = await _dbContext.PaymentSplits
                .Where(s => s.TransactionId == split.TransactionId)
                .ToListAsync();
            
            if (allSplits.All(s => s.State == TransactionState.Captured))
            {
                // Transaction complete - notify tenant
                await _tenantNotifier.NotifyTenant(new TenantNotification
                {
                    TransactionId = split.TransactionId,
                    TenantId = split.Transaction.TenantId,
                    Status = "PAID",
                    Splits = allSplits
                });
            }
        }
    }
    
    inboxEntry.Processed = true;
    inboxEntry.ProcessedAt = DateTime.UtcNow;
    
    await _dbContext.SaveChangesAsync();
    
    return Ok(new { Status = "Processed" });
}
```

---

## Provider Adapters

### ZaloPayAdapter.cs

```csharp
public class ZaloPayAdapter : IPaymentProviderAdapter
{
    public string ProviderId => "ZALOPAY";
    public string ProviderName => "ZaloPay";
    
    public async Task<CreateOrderResult> CreateOrder(CreateOrderCommand command)
    {
        // Call ZaloPay API
        var orderData = new
        {
            app_id = _config.MerchantId,
            app_trans_id = command.OrderCode,
            app_user = command.CustomerInfo?.Name ?? "User",
            amount = (long)command.Amount,
            app_time = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            item = "[]",
            description = $"Payment for {command.OrderCode}",
            callback_url = _config.CallbackUrl,
            return_url = command.ReturnUrl
        };
        
        // Generate MAC
        var mac = GenerateMac(orderData);
        
        // Call ZaloPay create order API
        var response = await _httpClient.PostAsJsonAsync(
            "https://sandbox.zalopay.vn/v001/tpe/createorder",
            new { ...orderData, mac });
        
        var result = await response.Content.ReadFromJsonAsync<ZaloPayCreateOrderResponse>();
        
        return new CreateOrderResult
        {
            OrderId = result.ZpTransToken,
            PaymentUrl = result.OrderUrl,
            QrCode = result.QrCode
        };
    }
    
    public async Task<WebhookVerificationResult> VerifyWebhook(HttpRequest request)
    {
        // Read body
        var body = await new StreamReader(request.Body).ReadToEndAsync();
        var data = JsonSerializer.Deserialize<ZaloPayCallback>(body);
        
        // Verify MAC
        var expectedMac = GenerateMac(data);
        var isValid = data.Mac == expectedMac;
        
        return new WebhookVerificationResult
        {
            IsValid = isValid,
            Timestamp = DateTimeOffset.FromUnixTimeMilliseconds(data.AppTime).DateTime
        };
    }
    
    public async Task<NormalizedCallbackData> ParseCallback(HttpRequest request)
    {
        var body = await new StreamReader(request.Body).ReadToEndAsync();
        var data = JsonSerializer.Deserialize<ZaloPayCallback>(body);
        
        return new NormalizedCallbackData
        {
            ProviderOrderId = data.AppTransId,
            ProviderTransactionId = data.ZpTransId,
            Amount = data.Amount,
            Status = data.Status.ToString(),
            Timestamp = DateTimeOffset.FromUnixTimeMilliseconds(data.AppTime).DateTime
        };
    }
    
    public TransactionState MapProviderStatus(string providerStatus)
    {
        return providerStatus switch
        {
            "1" => TransactionState.Captured,
            "2" => TransactionState.Failed,
            "3" => TransactionState.PendingAuthorize,
            _ => TransactionState.Failed
        };
    }
}
```

---

## Configuration (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=payment_hub;Username=payment_hub;Password=payment_hub_password"
  },
  "Redis": {
    "ConnectionString": "localhost:6379"
  },
  "Kafka": {
    "BootstrapServers": "localhost:9092",
    "GroupId": "payment-hub"
  },
  "PaymentPageUrl": "http://localhost:3000",
  "Providers": {
    "ZaloPay": {
      "ApiUrl": "https://sandbox.zalopay.vn",
      "Timeout": 30
    },
    "MoMo": {
      "ApiUrl": "https://test-payment.momo.vn",
      "Timeout": 30
    }
  }
}
```

---

## Running the Backend

```bash
# Restore dependencies
dotnet restore

# Run migrations
dotnet ef database update --project src/PaymentHub.Infrastructure

# Run API
dotnet run --project src/PaymentHub.Api

# API will be available at http://localhost:5000
```

---

**Version**: 1.0  
**Last Updated**: 2026-04-27  
**Owner**: Payment Hub Team
