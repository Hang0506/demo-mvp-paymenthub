namespace PaymentHub.Core.Entities;

public class ProviderConfig
{
    public Guid Id { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public string ProviderId { get; set; } = string.Empty;
    public bool Enabled { get; set; } = true;
    public string MerchantId { get; set; } = string.Empty;
    public string ApiKeyRef { get; set; } = string.Empty; // KMS reference
    public string SecretKeyRef { get; set; } = string.Empty; // KMS reference
    public string CallbackUrl { get; set; } = string.Empty;
    public string ReturnUrl { get; set; } = string.Empty;
    public string[]? WebhookIpWhitelist { get; set; }
    public string? ExtraConfig { get; set; } // JSON
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
