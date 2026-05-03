namespace PaymentHub.Core.Entities;

public class PaymentSplit
{
    public Guid Id { get; set; }
    public string SplitCode { get; set; } = string.Empty;
    public Guid TransactionId { get; set; }
    public string MethodId { get; set; } = string.Empty;
    public string? ProviderId { get; set; }
    public decimal Amount { get; set; }
    public TransactionState State { get; set; }
    public string? ProviderTransactionId { get; set; }
    public string? ProviderOrderId { get; set; }
    public string? RedirectUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    
    public Transaction Transaction { get; set; } = null!;
}
