namespace PaymentHub.Dtos;

public class PaymentStatusResponse
{
    public string PaymentRequestCode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal PaidAmount { get; set; }
    public List<PaymentSplitStatusDto> Splits { get; set; } = new();
    /// <summary>
    /// URL redirect về merchant sau khi thanh toán hoàn tất.
    /// Frontend dùng để redirect user về web/app của tenant.
    /// </summary>
    public string? ReturnUrl { get; set; }
}

public class PaymentSplitStatusDto
{
    public string SplitCode { get; set; } = string.Empty;
    public string MethodId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ProviderTransactionId { get; set; }
}