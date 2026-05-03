using Volo.Abp.Domain.Entities.Auditing;

namespace PaymentHub.Entities;

public class ProviderConfig : AuditedEntity<Guid>
{
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
    
    protected ProviderConfig()
    {
    }
    
    public ProviderConfig(
        Guid id,
        string tenantId,
        string providerId,
        string merchantId,
        string callbackUrl,
        string returnUrl
    ) : base(id)
    {
        TenantId = tenantId;
        ProviderId = providerId;
        MerchantId = merchantId;
        CallbackUrl = callbackUrl;
        ReturnUrl = returnUrl;
        Enabled = true;
    }
}
