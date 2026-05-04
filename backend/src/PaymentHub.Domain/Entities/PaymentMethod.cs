using Volo.Abp.Domain.Entities.Auditing;

namespace PaymentHub.Entities;

/// <summary>
/// Phương thức thanh toán mà tenant hỗ trợ.
/// MethodId = loại hình PTTT: CASH, E_WALLET, BANK_TRANSFER, CARD
/// (không phải provider cụ thể như ZaloPay, MoMo)
/// </summary>
public class PaymentMethod : AuditedEntity<Guid>
{
    public string TenantId { get; set; } = string.Empty;

    /// <summary>
    /// MerchantCode — PTTT gắn với merchant (web/app) cụ thể.
    /// Null = áp dụng cho toàn tenant (legacy).
    /// </summary>
    public string? MerchantCode { get; set; }

    public string MethodId { get; set; } = string.Empty;
    public string MethodName { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public bool Enabled { get; set; } = true;
    public int DisplayOrder { get; set; }

    protected PaymentMethod() { }

    public PaymentMethod(Guid id, string tenantId, string methodId, string methodName, string? merchantCode = null) : base(id)
    {
        TenantId = tenantId;
        MerchantCode = merchantCode;
        MethodId = methodId;
        MethodName = methodName;
        Enabled = true;
    }
}