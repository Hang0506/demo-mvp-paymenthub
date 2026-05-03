using Volo.Abp.Domain.Entities.Auditing;

namespace PaymentHub.Entities;

public class Tenant : AuditedAggregateRoot<Guid>
{
    public string TenantId { get; set; } = string.Empty;
    public string TenantName { get; set; } = string.Empty;
    public string WebhookUrl { get; set; } = string.Empty;
    public string? WebhookSecret { get; set; }
    public int RateLimitPerMinute { get; set; } = 100;
    public bool Enabled { get; set; } = true;
    
    protected Tenant()
    {
    }
    
    public Tenant(
        Guid id,
        string tenantId,
        string tenantName,
        string webhookUrl
    ) : base(id)
    {
        TenantId = tenantId;
        TenantName = tenantName;
        WebhookUrl = webhookUrl;
        Enabled = true;
    }
}
