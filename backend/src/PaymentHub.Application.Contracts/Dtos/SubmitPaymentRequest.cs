namespace PaymentHub.Dtos;

public class SubmitPaymentRequest
{
    public List<PaymentSplitDto> Splits { get; set; } = new();
}

public class PaymentSplitDto
{
    public string MethodId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class SubmitPaymentResponse
{
    public string TransactionId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public List<PaymentSplitResultDto> Splits { get; set; } = new();
}

public class PaymentSplitResultDto
{
    public string SplitCode { get; set; } = string.Empty;
    public string MethodId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? RedirectUrl { get; set; }
}