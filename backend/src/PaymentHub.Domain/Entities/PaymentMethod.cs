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
    /// Loại hình PTTT: CASH, E_WALLET, BANK_TRANSFER, CARD, QR_CODE
    /// </summary>
    public string MethodId { get; set; } = string.Empty;

    /// <summary>
    /// Tên hiển thị: "Tiền mặt", "Ví điện tử", "Chuyển khoản"
    /// </summary>
    public string MethodName { get; set; } = string.Empty;

    public string? IconUrl { get; set; }
    public bool Enabled { get; set; } = true;
    public int DisplayOrder { get; set; }

    protected PaymentMethod() { }

    public PaymentMethod(Guid id, string tenantId, string methodId, string methodName) : base(id)
    {
        TenantId = tenantId;
        MethodId = methodId;
        MethodName = methodName;
        Enabled = true;
    }
}