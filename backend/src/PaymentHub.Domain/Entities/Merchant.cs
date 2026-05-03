using Volo.Abp.Domain.Entities.Auditing;

namespace PaymentHub.Entities;

/// <summary>
/// Merchant là web/app của Tenant đăng ký với PaymentHub.
/// Mỗi merchant có mã riêng (MerchantCode) và redirect URL riêng.
/// Khi tạo payment, tenant backend truyền MerchantCode → PaymentHub redirect về RedirectUrl tương ứng.
/// </summary>
public class Merchant : AuditedAggregateRoot<Guid>
{
    public string TenantId { get; set; } = string.Empty;
    public string MerchantCode { get; set; } = string.Empty; // Mã merchant, tenant dùng khi tạo payment
    public string MerchantName { get; set; } = string.Empty; // Tên hiển thị (vd: Web RSA, App Mobile)
    public string RedirectUrl { get; set; } = string.Empty;  // URL redirect về sau thanh toán
    public bool Enabled { get; set; } = true;

    protected Merchant() { }

    public Merchant(
        Guid id,
        string tenantId,
        string merchantCode,
        string merchantName,
        string redirectUrl
    ) : base(id)
    {
        TenantId = tenantId;
        MerchantCode = merchantCode;
        MerchantName = merchantName;
        RedirectUrl = redirectUrl;
        Enabled = true;
    }
}
