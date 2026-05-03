using Microsoft.Extensions.Logging;
using PaymentHub.Interfaces;

namespace PaymentHub.Application.Services.Adapters;

/// <summary>
/// VNPay Provider Adapter.
/// 
/// VNPay vnp_ResponseCode mapping:
///   00 = Success / Captured
///   07 = Suspicious transaction → PendingAuthorize (manual review)
///   09 = Card not registered for internet banking → Failed
///   10 = Incorrect card info > 3 times → Failed
///   11 = Payment timeout → Cancelled
///   12 = Card locked → Failed
///   13 = Wrong OTP → Failed
///   24 = Customer cancelled → Cancelled
///   51 = Insufficient balance → Failed
///   65 = Daily limit exceeded → Failed
///   75 = Bank under maintenance → Failed
///   79 = Wrong PIN > 5 times → Failed
///   99 = Other error → Failed
/// </summary>
public class VnPayProviderAdapter : IPaymentProviderAdapter
{
    public string ProviderId   => "VNPAY";
    public string ProviderName => "VNPay";

    private readonly IKmsService _kms;
    private readonly ILogger<VnPayProviderAdapter> _logger;

    public VnPayProviderAdapter(IKmsService kms, ILogger<VnPayProviderAdapter> logger)
    {
        _kms    = kms;
        _logger = logger;
    }

    // ── Canonical State Mapping (Property 17) ────────────────────────────────
    public TransactionState MapProviderStatus(string providerStatus)
    {
        return providerStatus switch
        {
            "00" => TransactionState.Captured,
            "07" => TransactionState.PendingAuthorize,   // suspicious, pending review
            "11" or "24" => TransactionState.Cancelled,
            "09" or "10" or "12" or "13" or "51"
                or "65" or "75" or "79" or "99" => TransactionState.Failed,
            _ => TransactionState.Failed
        };
    }

    public async Task<CreateOrderResult> CreateOrder(CreateOrderCommand command)
    {
        _logger.LogInformation("[VNPay] Creating order for {OrderCode}, amount={Amount}",
            command.OrderCode, command.Amount);

        var txnRef = $"VNPAY_{command.OrderCode}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
        var paymentUrl = $"https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef={txnRef}";

        return await Task.FromResult(new CreateOrderResult(
            OrderId:    txnRef,
            PaymentUrl: paymentUrl
        ));
    }

    public Task<QueryOrderResult> QueryOrder(string providerOrderId)
    {
        return Task.FromResult(new QueryOrderResult(
            OrderId: providerOrderId,
            Status:  "00",
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
            ProviderOrderId:       "mock_vnpay_order",
            ProviderTransactionId: "mock_vnpay_txn",
            Amount:                0,
            Status:                "00",
            Timestamp:             DateTime.UtcNow
        ));
    }
}
