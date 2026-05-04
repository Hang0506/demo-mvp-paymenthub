namespace PaymentHub.Dtos;

public class CreateTenantRequest
{
    public string TenantId { get; set; } = string.Empty;
    public string TenantName { get; set; } = string.Empty;
    public string WebhookUrl { get; set; } = string.Empty;
}

public class RegisterPaymentMethodsRequest
{
    /// <summary>
    /// MerchantCode — đăng ký PTTT cho merchant cụ thể (web/app).
    /// Bắt buộc theo flow: Tenant → Merchant → PTTT → Provider
    /// </summary>
    public string MerchantCode { get; set; } = string.Empty;
    public List<PaymentMethodRegistrationDto> Methods { get; set; } = new();
}

public class PaymentMethodRegistrationDto
{
    public string MethodId { get; set; } = string.Empty;
    public string MethodName { get; set; } = string.Empty;
    public bool Enabled { get; set; } = true;
}

public class ConfigureProviderRequest
{
    public bool Enabled { get; set; } = true;
    public string MerchantId { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    // CallbackUrl: PaymentHub tự config ở portal provider
    // ReturnUrl: truyền vào lúc tạo payment request (per-transaction), không config ở đây
}

public class TenantDto
{
    public string TenantId { get; set; } = string.Empty;
    public string TenantName { get; set; } = string.Empty;
    public string WebhookUrl { get; set; } = string.Empty;
    public bool Enabled { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ProviderConfigDto
{
    public string ProviderId { get; set; } = string.Empty;
    public string MerchantId { get; set; } = string.Empty;
    public string ApiKeyRef { get; set; } = string.Empty;
    public bool Enabled { get; set; }
}

// PTTT response DTO — dùng cho GET /payment-tenants/{id}/payment-methods
public class PaymentMethodListDto
{
    public string MethodId { get; set; } = string.Empty;
    public string MethodName { get; set; } = string.Empty;
    public string? MerchantCode { get; set; }
    public bool Enabled { get; set; }
}

public class CreateMerchantRequest
{
    public string MerchantCode { get; set; } = string.Empty;
    public string MerchantName { get; set; } = string.Empty;
    public string RedirectUrl { get; set; } = string.Empty;
}

public class MerchantDto
{
    public Guid Id { get; set; }
    public string MerchantCode { get; set; } = string.Empty;
    public string MerchantName { get; set; } = string.Empty;
    public string RedirectUrl { get; set; } = string.Empty;
    public bool Enabled { get; set; }
    public DateTime CreatedAt { get; set; }
}
