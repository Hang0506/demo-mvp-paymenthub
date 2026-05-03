using PaymentHub.Dtos;
using PaymentHub.Entities;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Text;
using PaymentHub.Application.Contracts.Dtos;
using PaymentHub.Application.Services;
using PaymentHub.Interfaces;

namespace PaymentHub.Services;

public class PaymentAppService : ApplicationService, IPaymentAppService
{
    private readonly IRepository<Transaction, Guid> _transactionRepository;
    private readonly IRepository<PaymentMethod, Guid> _paymentMethodRepository;
    private readonly IRepository<PaymentSplit, Guid> _paymentSplitRepository;
    private readonly IRepository<ProviderConfig, Guid> _providerConfigRepository;
    private readonly IRepository<Tenant, Guid> _tenantRepository;
    private readonly IRepository<Merchant, Guid> _merchantRepository;
    private readonly IConfiguration _configuration;
    private readonly IZaloPayService _zaloPayService;
    private readonly IProviderAdapterRegistry _adapterRegistry;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<PaymentAppService> _log;

    // Map PTTT → provider IDs để lookup ProviderConfig
    private static readonly Dictionary<string, string[]> MethodToProviders = new()
    {
        ["E_WALLET"]      = new[] { "ZALOPAY", "MOMO" },
        ["BANK_TRANSFER"] = new[] { "VNPAY", "NAPAS" },
        ["CARD"]          = new[] { "VNPAY", "ONEPAY" },
    };

    public PaymentAppService(
        IRepository<Transaction, Guid> transactionRepository,
        IRepository<PaymentMethod, Guid> paymentMethodRepository,
        IRepository<PaymentSplit, Guid> paymentSplitRepository,
        IRepository<ProviderConfig, Guid> providerConfigRepository,
        IRepository<Tenant, Guid> tenantRepository,
        IRepository<Merchant, Guid> merchantRepository,
        IConfiguration configuration,
        IZaloPayService zaloPayService,
        IProviderAdapterRegistry adapterRegistry,
        IHttpClientFactory httpClientFactory,
        ILogger<PaymentAppService> log)
    {
        _transactionRepository = transactionRepository;
        _paymentMethodRepository = paymentMethodRepository;
        _paymentSplitRepository = paymentSplitRepository;
        _providerConfigRepository = providerConfigRepository;
        _tenantRepository = tenantRepository;
        _merchantRepository = merchantRepository;
        _configuration = configuration;
        _zaloPayService = zaloPayService;
        _adapterRegistry = adapterRegistry;
        _httpClientFactory = httpClientFactory;
        _log = log;
    }

    public async Task<CreatePaymentResponse> CreatePaymentAsync(CreatePaymentRequest request)
    {
        var shortId = Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();
        var paymentCode = $"PAY-{DateTime.UtcNow:yyyyMMdd}-{shortId}";
        var txnShortId = Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();

        var transaction = new Transaction(
            GuidGenerator.Create(),
            $"TXN-{DateTime.UtcNow:yyyyMMdd}-{txnShortId}",
            paymentCode,
            request.TenantId,
            request.OrderCode,
            request.Amount,
            request.Currency
        );

        if (request.CustomerInfo != null)
        {
            transaction.CustomerInfo = JsonSerializer.Serialize(request.CustomerInfo);
        }

        // Resolve ReturnUrl: ưu tiên MerchantCode → lookup RedirectUrl, fallback ReturnUrl trực tiếp
        if (!string.IsNullOrEmpty(request.MerchantCode))
        {
            var merchant = await _merchantRepository.FirstOrDefaultAsync(
                m => m.TenantId == request.TenantId && m.MerchantCode == request.MerchantCode && m.Enabled);
            if (merchant != null)
                transaction.ReturnUrl = merchant.RedirectUrl;
            else
                transaction.ReturnUrl = request.ReturnUrl; // fallback
        }
        else if (!string.IsNullOrEmpty(request.ReturnUrl))
        {
            transaction.ReturnUrl = request.ReturnUrl;
        }

        await _transactionRepository.InsertAsync(transaction);

        var paymentPageUrl = _configuration["PaymentPageUrl"] ?? "http://localhost:3000";
        var paymentUrl = $"{paymentPageUrl}/payment/{paymentCode}";

        return new CreatePaymentResponse
        {
            PaymentRequestCode = paymentCode,
            PaymentUrl = paymentUrl,
            QrCode = GenerateMockQrCode(paymentUrl)
        };
    }

    public async Task<GetPaymentMethodsResponse> GetPaymentMethodsAsync(string paymentCode)
    {
        var transaction = await _transactionRepository.FirstOrDefaultAsync(t => t.PaymentRequestCode == paymentCode);
        if (transaction == null)
        {
            throw new UserFriendlyException("Payment not found");
        }

        var methods = await _paymentMethodRepository.GetListAsync(m =>
            m.TenantId == transaction.TenantId && m.Enabled);

        var providers = await _providerConfigRepository.GetListAsync(p =>
            p.TenantId == transaction.TenantId && p.Enabled);

        var providerNames = new Dictionary<string, string>
        {
            ["ZALOPAY"] = "ZaloPay",
            ["MOMO"]    = "MoMo",
            ["VNPAY"]   = "VNPay",
            ["NAPAS"]   = "Napas VietQR",
            ["ONEPAY"]  = "OnePay",
        };

        var result = methods.OrderBy(m => m.DisplayOrder).Select(method =>
        {
            var dto = new PaymentMethodDto
            {
                MethodId   = method.MethodId,
                MethodName = method.MethodName,
                Enabled    = method.Enabled,
            };

            // Nếu PTTT có provider → gắn danh sách provider con đã cấu hình
            if (MethodToProviders.TryGetValue(method.MethodId, out var candidateProviders))
            {
                dto.Providers = providers
                    .Where(p => candidateProviders.Contains(p.ProviderId))
                    .OrderBy(p => Array.IndexOf(candidateProviders, p.ProviderId))
                    .Select(p => new ProviderDto
                    {
                        ProviderId   = p.ProviderId,
                        ProviderName = providerNames.GetValueOrDefault(p.ProviderId, p.ProviderId),
                    })
                    .ToList();
            }

            return dto;
        }).ToList();

        return new GetPaymentMethodsResponse
        {
            PaymentRequestCode = paymentCode,
            Amount   = transaction.Amount,
            Currency = transaction.Currency,
            Methods  = result
        };
    }

    public async Task<SubmitPaymentResponse> SubmitPaymentAsync(string paymentCode, SubmitPaymentRequest request)
    {
        var transaction = await _transactionRepository.FirstOrDefaultAsync(t => t.PaymentRequestCode == paymentCode);
        if (transaction == null)
        {
            throw new UserFriendlyException("Payment not found");
        }

        var totalSplitAmount = request.Splits.Sum(s => s.Amount);

        // Tính số tiền đã thanh toán (Captured splits)
        var existingSplits = await _paymentSplitRepository.GetListAsync(s => s.TransactionId == transaction.Id);
        var alreadyPaid = existingSplits
            .Where(s => s.State == TransactionState.Captured)
            .Sum(s => s.Amount);
        var remainingAmount = transaction.Amount - alreadyPaid;

        if (totalSplitAmount != remainingAmount)
        {
            throw new UserFriendlyException($"Split amounts ({totalSplitAmount}) must equal remaining amount ({remainingAmount}). Already paid: {alreadyPaid}");
        }

        var splits = new List<PaymentSplit>();

        foreach (var splitRequest in request.Splits)
        {
            var splitShortId = Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();
            var split = new PaymentSplit(
                GuidGenerator.Create(),
                $"SPLIT-{splitShortId}",
                transaction.Id,
                splitRequest.MethodId,
                splitRequest.Amount
            );

            if (splitRequest.MethodId == "CASH")
            {
                split.UpdateState(TransactionState.Captured);
            }
            else
            {
                // Lookup ProviderConfig: ưu tiên provider đã cấu hình cho tenant
                // Nếu methodId là PTTT (E_WALLET, BANK_TRANSFER, CARD) → tìm provider tương ứng
                // Nếu methodId đã là provider cụ thể (ZALOPAY, MOMO...) → dùng trực tiếp
                var resolvedProviderId = splitRequest.MethodId;

                if (MethodToProviders.TryGetValue(splitRequest.MethodId, out var candidateProviders))
                {
                    // Tìm provider đầu tiên đã được cấu hình cho tenant này
                    var providerConfig = await _providerConfigRepository.FirstOrDefaultAsync(
                        p => p.TenantId == transaction.TenantId
                          && candidateProviders.Contains(p.ProviderId)
                          && p.Enabled);

                    if (providerConfig != null)
                    {
                        resolvedProviderId = providerConfig.ProviderId;
                    }
                    else
                    {
                        // Fallback: dùng provider đầu tiên trong danh sách
                        resolvedProviderId = candidateProviders[0];
                    }
                }

                split.ProviderId = resolvedProviderId;
                split.ProviderOrderId = $"ORDER-{Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()}";
                
                // ZaloPay integration: call API via adapter (reads credentials from KMS)
                if (resolvedProviderId == "ZALOPAY")
                {
                    var providerConfig = await _providerConfigRepository.FirstOrDefaultAsync(
                        p => p.TenantId == transaction.TenantId && p.ProviderId == "ZALOPAY");

                    // returnUrl: ZaloPay redirect browser về Payment Hub trước
                    // Payment Hub xử lý (cập nhật trạng thái) rồi redirect tiếp về merchant
                    // Flow: ZaloPay → Payment Hub /api/payments/{code}/zalopay-return → merchant ReturnUrl
                    var apiBaseUrl = _configuration["PaymentHubApiUrl"] ?? "http://localhost:5000";
                    var returnUrl = $"{apiBaseUrl}/api/payments/{paymentCode}/zalopay-return";

                    var adapter = _adapterRegistry.GetAdapter("ZALOPAY");
                    // Parse encrypted keys + AppId từ ExtraConfig (persist qua restart)
                    string encryptedApiKey = string.Empty;
                    string encryptedSecretKey = string.Empty;
                    int    extraAppId = 0;
                    string extraAppUser = string.Empty;
                    if (!string.IsNullOrEmpty(providerConfig?.ExtraConfig))
                    {
                        try
                        {
                            var extra = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(providerConfig.ExtraConfig);
                            encryptedApiKey    = extra.TryGetProperty("encryptedApiKey",    out var ak) ? ak.GetString() ?? "" : "";
                            encryptedSecretKey = extra.TryGetProperty("encryptedSecretKey", out var sk) ? sk.GetString() ?? "" : "";
                            extraAppId         = extra.TryGetProperty("appId",              out var ai) ? int.TryParse(ai.GetString(), out var aid) ? aid : 0 : 0;
                            extraAppUser       = extra.TryGetProperty("appUser",            out var au) ? au.GetString() ?? "" : "";
                        }
                        catch { }
                    }

                    var orderResult = await adapter.CreateOrder(new CreateOrderCommand(
                        Amount:      splitRequest.Amount,
                        OrderCode:   split.SplitCode,
                        ReturnUrl:   returnUrl,
                        TenantId:    transaction.TenantId,
                        ApiKeyRef:   providerConfig?.ApiKeyRef    ?? "",
                        SecretKeyRef: providerConfig?.SecretKeyRef ?? "",
                        AppId:       extraAppId,
                        AppUser:     extraAppUser,
                        // CallbackUrl: Payment Hub nhận webhook, KHÔNG phải merchant
                        // ZaloPay → POST /api/webhooks/zalopay → Payment Hub xử lý → notify tenant
                        CallbackUrl: providerConfig?.CallbackUrl ?? ""
                    ));

                    split.RedirectUrl    = orderResult.PaymentUrl;
                    split.ProviderOrderId = orderResult.OrderId;
                }
                else
                {
                    // Keep existing mock URL for other providers
                    split.RedirectUrl = $"https://{resolvedProviderId.ToLower()}.vn/pay?token=demo_{split.SplitCode}";
                }
                
                split.UpdateState(TransactionState.PendingAuthorize);
            }

            splits.Add(split);
            await _paymentSplitRepository.InsertAsync(split);
        }

        return new SubmitPaymentResponse
        {
            TransactionId = transaction.TransactionCode,
            Status = transaction.State.ToString(),
            Splits = ObjectMapper.Map<List<PaymentSplit>, List<PaymentSplitResultDto>>(splits)
        };
    }

    public async Task<PaymentStatusResponse> GetPaymentStatusAsync(string paymentCode)
    {
        var transaction = await _transactionRepository.GetAsync(t => t.PaymentRequestCode == paymentCode);
        var splits = await _paymentSplitRepository.GetListAsync(s => s.TransactionId == transaction.Id);

        var allCaptured  = splits.Count > 0 && splits.All(s => s.State == TransactionState.Captured);
        var allRefunded  = splits.Count > 0 && splits.All(s => s.State == TransactionState.Refunded);
        var anyRefunded  = splits.Any(s => s.State == TransactionState.Refunded);
        var anyFailed    = splits.Any(s => s.State == TransactionState.Failed);

        var status = allRefunded ? "REFUNDED"
                   : anyRefunded ? "PARTIAL_REFUND"
                   : allCaptured ? "PAID"
                   : anyFailed   ? "FAILED"
                   : "PENDING";

        return new PaymentStatusResponse
        {
            PaymentRequestCode = paymentCode,
            Status = status,
            Amount = transaction.Amount,
            PaidAmount = splits.Where(s => s.State == TransactionState.Captured).Sum(s => s.Amount),
            Splits = ObjectMapper.Map<List<PaymentSplit>, List<PaymentSplitStatusDto>>(splits),
            ReturnUrl = transaction.ReturnUrl
        };
    }

    public async Task<List<PaymentStatusResponse>> GetAllPaymentsAsync(string? tenantId)
    {
        var query = await _transactionRepository.GetQueryableAsync();
        if (!string.IsNullOrEmpty(tenantId))
            query = query.Where(t => t.TenantId == tenantId);

        var transactions = await AsyncExecuter.ToListAsync(query.OrderByDescending(t => t.CreationTime).Take(50));
        var result = new List<PaymentStatusResponse>();

        foreach (var txn in transactions)
        {
            var splits = await _paymentSplitRepository.GetListAsync(s => s.TransactionId == txn.Id);
            var allCaptured = splits.Count > 0 && splits.All(s => s.State == TransactionState.Captured);
            var allRefunded = splits.Count > 0 && splits.All(s => s.State == TransactionState.Refunded);
            var anyRefunded = splits.Any(s => s.State == TransactionState.Refunded);
            var anyFailed   = splits.Any(s => s.State == TransactionState.Failed);
            var status = allRefunded ? "REFUNDED"
                       : anyRefunded ? "PARTIAL_REFUND"
                       : allCaptured ? "PAID"
                       : anyFailed   ? "FAILED"
                       : "PENDING";

            result.Add(new PaymentStatusResponse
            {
                PaymentRequestCode = txn.PaymentRequestCode,
                Status = status,
                Amount = txn.Amount,
                PaidAmount = splits.Where(s => s.State == TransactionState.Captured).Sum(s => s.Amount),
                Splits = ObjectMapper.Map<List<PaymentSplit>, List<PaymentSplitStatusDto>>(splits)
            });
        }

        return result;
    }

    /// <summary>
    /// Xử lý ZaloPay return URL — ZaloPay redirect browser về đây sau khi user thanh toán.
    /// 
    /// Ghi nhận kết quả ngay từ redirect params (không chờ webhook):
    ///   - status=1 → Captured (thành công)
    ///   - status khác → Failed
    /// 
    /// Webhook từ ZaloPay là backup phòng trường hợp user đóng browser trước khi redirect.
    /// Idempotent: nếu split đã Captured (do webhook về trước) thì bỏ qua.
    /// 
    /// Trả về: merchantReturnUrl để controller redirect tiếp về merchant app.
    /// </summary>
    public async Task<string?> HandleZaloPayReturnAsync(string paymentCode, string appTransId, string status)
    {
        // Parse SplitCode từ AppTransId (format: yyMMdd_SPLIT-XXXXXX)
        var parts = appTransId.Split('_');
        if (parts.Length < 2)
        {
            _log.LogWarning("[ZaloPayReturn] Invalid appTransId format: {AppTransId}", appTransId);
            return null;
        }

        var splitCode = parts[1]; // "SPLIT-XXXXXX"

        var split = await _paymentSplitRepository.FirstOrDefaultAsync(s => s.SplitCode == splitCode);
        if (split == null)
        {
            _log.LogWarning("[ZaloPayReturn] Split not found: {SplitCode}", splitCode);
            return null;
        }

        var transaction = await _transactionRepository.GetAsync(split.TransactionId);

        // Idempotent: đã Captured rồi (webhook về trước) → bỏ qua, redirect luôn
        if (split.State != TransactionState.Captured)
        {
            if (status == "1")
            {
                // Thành công → ghi nhận Captured ngay từ redirect
                _log.LogInformation("[ZaloPayReturn] ✅ Captured split {SplitCode} from redirect", splitCode);
                split.UpdateState(TransactionState.Captured);
                split.ProviderTransactionId = appTransId;
            }
            else
            {
                // Thất bại
                _log.LogWarning("[ZaloPayReturn] ❌ Failed split {SplitCode}, status={Status}", splitCode, status);
                split.UpdateState(TransactionState.Failed);
            }

            await _paymentSplitRepository.UpdateAsync(split);

            // Nếu tất cả splits đã Captured → notify tenant
            if (status == "1")
            {
                var allSplits = await _paymentSplitRepository.GetListAsync(s => s.TransactionId == split.TransactionId);
                if (allSplits.All(s => s.State == TransactionState.Captured))
                {
                    _log.LogInformation("[ZaloPayReturn] All splits captured → notify tenant for {PaymentCode}", paymentCode);
                    await NotifyTenantWebhookAsync(transaction, allSplits);
                }
            }
        }
        else
        {
            _log.LogInformation("[ZaloPayReturn] Split {SplitCode} already Captured (webhook arrived first), skipping", splitCode);
        }

        // Trả về merchant ReturnUrl để redirect tiếp
        // Append status vào URL để merchant app biết kết quả
        var merchantUrl = transaction.ReturnUrl;
        if (!string.IsNullOrEmpty(merchantUrl))
        {
            var separator = merchantUrl.Contains('?') ? "&" : "?";
            merchantUrl += $"{separator}paymentCode={paymentCode}&status={status}";
        }

        return merchantUrl;
    }

    /// <summary>
    /// Gọi webhook về tenant backend sau khi payment PAID.
    /// </summary>
    private async Task NotifyTenantWebhookAsync(Transaction transaction, IList<PaymentSplit> splits)
    {
        var tenant = await _tenantRepository.FirstOrDefaultAsync(t => t.TenantId == transaction.TenantId);
        if (tenant == null || string.IsNullOrEmpty(tenant.WebhookUrl))
        {
            _log.LogWarning("[Webhook] Tenant {TenantId} has no webhookUrl", transaction.TenantId);
            return;
        }

        var payload = new
        {
            paymentRequestCode = transaction.PaymentRequestCode,
            transactionCode    = transaction.TransactionCode,
            tenantId           = transaction.TenantId,
            orderCode          = transaction.OrderCode,
            status             = "PAID",
            amount             = transaction.Amount,
            paidAmount         = splits.Where(s => s.State == TransactionState.Captured).Sum(s => s.Amount),
            returnUrl          = transaction.ReturnUrl,
            completedAt        = DateTime.UtcNow,
            splits             = splits.Select(s => new
            {
                splitCode             = s.SplitCode,
                methodId              = s.MethodId,
                providerId            = s.ProviderId,
                amount                = s.Amount,
                status                = s.State.ToString(),
                providerTransactionId = s.ProviderTransactionId,
            })
        };

        try
        {
            var client  = _httpClientFactory.CreateClient("webhook");
            var json    = JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");

            _log.LogInformation("[Webhook] → POST {Url} | PaymentCode={Code}", tenant.WebhookUrl, transaction.PaymentRequestCode);
            var response = await client.PostAsync(tenant.WebhookUrl, content);
            _log.LogInformation("[Webhook] ← {StatusCode} from {Url}", (int)response.StatusCode, tenant.WebhookUrl);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "[Webhook] Failed to notify tenant {TenantId} at {Url}", transaction.TenantId, tenant.WebhookUrl);
        }
    }

    /// <summary>
    /// Refund a PAID payment — marks all Captured splits as Refunded.
    /// In production: call provider refund API per split.
    /// </summary>
    public async Task<object> RefundPaymentAsync(string paymentCode, string reason)
    {
        var transaction = await _transactionRepository.GetAsync(t => t.PaymentRequestCode == paymentCode);
        var splits = await _paymentSplitRepository.GetListAsync(s => s.TransactionId == transaction.Id);

        var capturedSplits = splits.Where(s => s.State == TransactionState.Captured).ToList();
        if (!capturedSplits.Any())
            throw new UserFriendlyException("No captured splits to refund");

        var refundedAmount = 0m;
        foreach (var split in capturedSplits)
        {
            // In production: call provider refund API (ZaloPay, MoMo, etc.)
            // For demo: mark as Refunded directly
            split.UpdateState(TransactionState.Refunded);
            await _paymentSplitRepository.UpdateAsync(split);
            refundedAmount += split.Amount;
        }

        return new
        {
            paymentCode,
            refundedAmount,
            refundedSplits = capturedSplits.Count,
            reason,
            status = "Refunded"
        };
    }

    private static string GenerateMockQrCode(string url)
    {
        // Mock base64 1x1 pixel PNG
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    }

    /// <summary>
    /// Verifies MAC signature for ZaloPay callback
    /// </summary>
    public bool VerifyZaloPayCallback(ZaloPayCallbackRequest request)
    {
        if (_zaloPayService is MockZaloPayService mockService)
        {
            return mockService.VerifyCallbackMac(request.Data, request.Mac);
        }
        return false;
    }

    /// <summary>
    /// Handles ZaloPay callback to update payment status
    /// </summary>
    public async Task HandleZaloPayCallbackAsync(ZaloPayCallbackData data)
    {
        // Parse AppTransId to extract SplitCode (format: yyMMdd_SPLIT-XXXXXX)
        var parts = data.AppTransId.Split('_');
        if (parts.Length < 2)
        {
            throw new UserFriendlyException("Invalid AppTransId format");
        }

        var splitCode = parts[1];

        // Find PaymentSplit by SplitCode
        var split = await _paymentSplitRepository.FirstOrDefaultAsync(s => s.SplitCode == splitCode);
        if (split == null)
        {
            throw new UserFriendlyException($"Payment split not found: {splitCode}");
        }

        // Update split State to Captured
        split.UpdateState(TransactionState.Captured);
        split.ProviderOrderId = data.ZpTransId.ToString();

        await _paymentSplitRepository.UpdateAsync(split);
    }
}