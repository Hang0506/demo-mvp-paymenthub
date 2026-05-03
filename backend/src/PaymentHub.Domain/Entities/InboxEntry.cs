using Volo.Abp.Domain.Entities.Auditing;

namespace PaymentHub.Entities;

public class InboxEntry : CreationAuditedEntity<Guid>
{
    public string IdempotencyKey { get; set; } = string.Empty;
    public string ProviderId { get; set; } = string.Empty;
    public string ProviderTransactionId { get; set; } = string.Empty;
    public string WebhookData { get; set; } = string.Empty;
    public bool Processed { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime ExpiresAt { get; set; }

    protected InboxEntry() { }

    public InboxEntry(
        Guid id,
        string idempotencyKey,
        string providerId,
        string providerTransactionId,
        string webhookData
    ) : base(id)
    {
        IdempotencyKey = idempotencyKey;
        ProviderId = providerId;
        ProviderTransactionId = providerTransactionId;
        WebhookData = webhookData;
        ExpiresAt = DateTime.UtcNow.AddHours(24);
        Processed = false;
    }

    public void MarkAsProcessed()
    {
        Processed = true;
        ProcessedAt = DateTime.UtcNow;
    }
}