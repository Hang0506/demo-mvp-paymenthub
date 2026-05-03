using Volo.Abp.Domain.Entities.Auditing;

namespace PaymentHub.Entities;

public class TransactionEvent : CreationAuditedEntity<Guid>
{
    public Guid TransactionId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string EventData { get; set; } = string.Empty;
    public int SequenceNumber { get; set; }
    
    protected TransactionEvent()
    {
    }
    
    public TransactionEvent(
        Guid id,
        Guid transactionId,
        string eventType,
        string eventData,
        int sequenceNumber
    ) : base(id)
    {
        TransactionId = transactionId;
        EventType = eventType;
        EventData = eventData;
        SequenceNumber = sequenceNumber;
    }
}
