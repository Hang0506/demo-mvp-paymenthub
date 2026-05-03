using Microsoft.Extensions.Logging;
using PaymentHub.Interfaces;

namespace PaymentHub.Application.Services.Adapters;

/// <summary>
/// MoMo Provider Adapter.
/// 
/// MoMo resultCode mapping:
///   0    = Success / Captured
///   1000 = Initiated / PendingAuthorize
///   1001 = Insufficient funds → Failed
///   1002 = Rejected by issuer → Failed
///   1003 = Cancelled → Cancelled
///   1004 = Amount exceeds limit → Failed
///   9000 = Transaction authorized (not yet captured) → Authorized
/// </summary>
public class MoMoProviderAdapter : IPaymentProviderAdapter
{
    public string ProviderId   => "MOMO";
    public string ProviderName => "MoMo";

    private readonly IKmsService _kms;
    private readonly ILogger<MoMoProviderAdapter> _logger;

    public MoMoProviderAdapter(IKmsService kms, ILogger<MoMoProviderAdapter> logger)
    {
        _kms    = kms;
        _logger = logger;
    }

    // ── Canonical State Mapping (Property 17) ────────────────────────────────
    public TransactionState MapProviderStatus(string providerStatus)
    {
        return providerStatus switch
        {
            "0"    => TransactionState.Captured,
            "9000" => TransactionState.Authorized,
            "1000" => TransactionState.PendingAuthorize,
            "1003" => TransactionState.Cancelled,
            "1001" or "1002" or "1004" => TransactionState.Failed,
            _      => TransactionState.Failed
        };
    }

    public async Task<CreateOrderResult> CreateOrder(CreateOrderCommand command)
    {
        _logger.LogInformation("[MoMo] Creating order for {OrderCode}, amount={Amount}",
            command.OrderCode, command.Amount);

        var requestId = Guid.NewGuid().ToString("N");
        var paymentUrl = $"https://test-payment.momo.vn/v2/gateway/pay?requestId={requestId}";

        return await Task.FromResult(new CreateOrderResult(
            OrderId:    requestId,
            PaymentUrl: paymentUrl
        ));
    }

    public Task<QueryOrderResult> QueryOrder(string providerOrderId)
    {
        return Task.FromResult(new QueryOrderResult(
            OrderId: providerOrderId,
            Status:  "0",
            Amount:  0
        ));
    }

    public Task<WebhookVerificationResult> VerifyWebhook(WebhookPayload payload)
    {
        return Task.FromResult(new WebhookVerificationResult(
            IsValid:   true,
            Timestamp: DateTime.UtcNow,
            Nonce:     Guid.NewGuid().ToString()
        ));
    }

    public Task<NormalizedCallbackData> ParseCallback(WebhookPayload payload)
    {
        return Task.FromResult(new NormalizedCallbackData(
            ProviderOrderId:       "mock_momo_order",
            ProviderTransactionId: "mock_momo_txn",
            Amount:                0,
            Status:                "0",
            Timestamp:             DateTime.UtcNow
        ));
    }
}
