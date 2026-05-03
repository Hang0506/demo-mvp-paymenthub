namespace PaymentHub.Dtos;

public class PaymentMethodDto
{
    public string MethodId { get; set; } = string.Empty;
    public string MethodName { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public bool Enabled { get; set; }
    /// <summary>
    /// Danh sách provider cụ thể thuộc PTTT này (đã cấu hình cho tenant).
    /// Ví dụ: E_WALLET → [ZALOPAY, MOMO]
    /// Rỗng nếu PTTT không cần provider (CASH) hoặc chưa cấu hình.
    /// </summary>
    public List<ProviderDto> Providers { get; set; } = new();
}

public class ProviderDto
{
    public string ProviderId { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
}

public class GetPaymentMethodsResponse
{
    public string PaymentRequestCode { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public List<PaymentMethodDto> Methods { get; set; } = new();
}