namespace PaymentHub.Core.Interfaces;

public interface ITenantNotifier
{
    Task<NotifyResult> NotifyTenant(TenantNotification notification);
}

public record TenantNotification(
    Guid TransactionId,
    string TenantId,
    string Status,
    object Splits
);

public record NotifyResult(
    bool Success,
    string? Error = null
);
