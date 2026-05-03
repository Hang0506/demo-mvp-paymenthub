namespace PaymentHub.Dtos;

public class CreatePaymentRequest
{
    public string TenantId { get; set; } = string.Empty;
    public string OrderCode { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "VND";
    public CustomerInfoDto? CustomerInfo { get; set; }
    /// <summary>
    /// Mã merchant (web/app của tenant). PaymentHub lookup RedirectUrl từ mã này.
    /// Nếu không truyền, dùng ReturnUrl trực tiếp (backward compatible).
    /// </summary>
    public string? MerchantCode { get; set; }
    /// <summary>
    /// URL redirect trực tiếp (dùng khi không có MerchantCode).
    /// </summary>
    public string ReturnUrl { get; set; } = string.Empty;
}

public class CustomerInfoDto
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
}
