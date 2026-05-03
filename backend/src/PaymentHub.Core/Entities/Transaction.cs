namespace PaymentHub.Core.Entities;

public class Transaction
{
    public Guid Id { get; set; }
    public string TransactionCode { get; set; } = string.Empty;
    public string PaymentRequestCode { get; set; } = string.Empty;
    public string TenantId { get; set; } = string.Empty;
    public string OrderCode { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "VND";
    public TransactionState State { get; set; }
    public string? CustomerInfo { get; set; }
    public string? Metadata { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    
    public List<PaymentSplit> Splits { get; set; } = new();
    public List<TransactionEvent> Events { get; set; } = new();
}

public enum TransactionState
{
    Created,
    PendingAuthorize,
    Authorized,
    Captured,
    Failed,
    Cancelled,
    Refunding,
    Refunded,
    Settled
}
