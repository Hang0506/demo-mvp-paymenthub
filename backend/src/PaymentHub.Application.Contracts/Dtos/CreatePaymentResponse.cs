namespace PaymentHub.Dtos;

public class CreatePaymentResponse
{
    public string PaymentRequestCode { get; set; } = string.Empty;
    public string PaymentUrl { get; set; } = string.Empty;
    public string? QrCode { get; set; }
}