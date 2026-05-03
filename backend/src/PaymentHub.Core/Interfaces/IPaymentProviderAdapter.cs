using PaymentHub.Core.Entities;

namespace PaymentHub.Core.Interfaces;

public interface IPaymentProviderAdapter
{
    string ProviderId { get; }
    string ProviderName { get; }
    
    Task<CreateOrderResult> CreateOrder(CreateOrderCommand command);
    Task<QueryOrderResult> QueryOrder(string providerOrderId);
    Task<WebhookVerificationResult> VerifyWebhook(WebhookPayload payload);
    Task<NormalizedCallbackData> ParseCallback(WebhookPayload payload);
    TransactionState MapProviderStatus(string providerStatus);
}

public record CreateOrderCommand(
    decimal Amount,
    string OrderCode,
    string ReturnUrl,
    CustomerInfo? CustomerInfo = null
);

public record CreateOrderResult(
    string OrderId,
    string PaymentUrl,
    string? QrCode = null
);

public record QueryOrderResult(
    string OrderId,
    string Status,
    decimal Amount
);

public record WebhookPayload(
    string RawBody,
    Dictionary<string, string> Headers
);

public record WebhookVerificationResult(
    bool IsValid,
    DateTime Timestamp,
    string? Nonce = null
);

public record NormalizedCallbackData(
    string ProviderOrderId,
    string ProviderTransactionId,
    decimal Amount,
    string Status,
    DateTime Timestamp
);

public record CustomerInfo(
    string Name,
    string Phone,
    string? Email = null
);
