using Volo.Abp.Domain.Entities.Auditing;

namespace PaymentHub.Entities;

public class PaymentSplit : CreationAuditedEntity<Guid>
{
    public string SplitCode { get; set; } = string.Empty;
    public Guid TransactionId { get; set; }
    public string MethodId { get; set; } = string.Empty;
    public string? ProviderId { get; set; }
    public decimal Amount { get; set; }
    public TransactionState State { get; set; }
    public string? ProviderTransactionId { get; set; }
    public string? ProviderOrderId { get; set; }
    public string? RedirectUrl { get; set; }
    public DateTime? CompletedAt { get; set; }
    
    protected PaymentSplit()
    {
    }
    
    public PaymentSplit(
        Guid id,
        string splitCode,
        Guid transactionId,
        string methodId,
        decimal amount
    ) : base(id)
    {
        SplitCode = splitCode;
        TransactionId = transactionId;
        MethodId = methodId;
        Amount = amount;
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
