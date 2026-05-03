using Volo.Abp.Domain.Entities.Auditing;

namespace PaymentHub.Entities;

public class Transaction : CreationAuditedAggregateRoot<Guid>
{
    public string TransactionCode { get; set; } = string.Empty;
    public string PaymentRequestCode { get; set; } = string.Empty;
    public string TenantId { get; set; } = string.Empty;
    public string OrderCode { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "VND";
    public TransactionState State { get; set; }
    public string? CustomerInfo { get; set; }
    public string? ReturnUrl { get; set; }
    public string? Metadata { get; set; }
    public DateTime? CompletedAt { get; set; }
    
    protected Transaction()
    {
    }
    
    public Transaction(
        Guid id,
        string transactionCode,
        string paymentRequestCode,
        string tenantId,
        string orderCode,
        decimal amount,
        string currency = "VND"
    ) : base(id)
    {
        TransactionCode = transactionCode;
        PaymentRequestCode = paymentRequestCode;
        TenantId = tenantId;
        OrderCode = orderCode;
        Amount = amount;
        Currency = currency;
        State = TransactionState.Created;
    }
    
    public void UpdateState(TransactionState newState)
    {
        State = newState;
        if (newState == TransactionState.Captured || newState == TransactionState.Failed)
        {
            CompletedAt = DateTime.UtcNow;
        }
    }
}
