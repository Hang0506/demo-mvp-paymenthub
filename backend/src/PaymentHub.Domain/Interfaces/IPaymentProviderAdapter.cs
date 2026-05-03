namespace PaymentHub.Interfaces;

/// <summary>
/// Contract mà mọi payment provider adapter phải implement.
/// Property 17: MapProviderStatus() chuẩn hóa provider-specific status
/// thành canonical TransactionState — provider codes KHÔNG leak ra ngoài adapter.
/// </summary>
public interface IPaymentProviderAdapter
{
    string ProviderId   { get; }
    string ProviderName { get; }

    Task<CreateOrderResult>          CreateOrder(CreateOrderCommand command);
    Task<QueryOrderResult>           QueryOrder(string providerOrderId);
    Task<WebhookVerificationResult>  VerifyWebhook(WebhookPayload payload);
    Task<NormalizedCallbackData>     ParseCallback(WebhookPayload payload);

    /// <summary>
    /// Maps provider-specific status string to canonical TransactionState.
    /// Each adapter owns its own mapping table.
    /// </summary>
    TransactionState MapProviderStatus(string providerStatus);
}

// ── Command / Result records ─────────────────────────────────────────────────

public record CreateOrderCommand(
    decimal Amount,
    string  OrderCode,
    string  ReturnUrl,
    string  TenantId     = "",
    string  ApiKeyRef    = "",
    string  SecretKeyRef = "",
    int     AppId        = 0,
    string  AppUser      = "",
    string  CallbackUrl  = "",   // URL Payment Hub nhận webhook từ provider
    CustomerInfo? CustomerInfo = null
);

public record CreateOrderResult(
    string  OrderId,
    string  PaymentUrl,
    string? QrCode = null
);

public record QueryOrderResult(
    string  OrderId,
    string  Status,
    decimal Amount
);

public record WebhookPayload(
    string                      RawBody,
    Dictionary<string, string>  Headers
);

public record WebhookVerificationResult(
    bool     IsValid,
    DateTime Timestamp,
    string?  Nonce = null
);

public record NormalizedCallbackData(
    string   ProviderOrderId,
    string   ProviderTransactionId,
    decimal  Amount,
    string   Status,
    DateTime Timestamp
);

public record CustomerInfo(
    string  Name,
    string  Phone,
    string? Email = null
);
