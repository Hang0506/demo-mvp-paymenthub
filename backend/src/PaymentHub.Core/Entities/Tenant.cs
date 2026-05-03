namespace PaymentHub.Core.Entities;

public class Tenant
{
    public Guid Id { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public string TenantName { get; set; } = string.Empty;
    public string WebhookUrl { get; set; } = string.Empty;
    public string? WebhookSecret { get; set; }
    public int RateLimitPerMinute { get; set; } = 100;
    public bool Enabled { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
