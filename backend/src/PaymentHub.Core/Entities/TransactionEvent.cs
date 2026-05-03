namespace PaymentHub.Core.Entities;

public class TransactionEvent
{
    public Guid Id { get; set; }
    public Guid TransactionId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string EventData { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int SequenceNumber { get; set; }
    
    public Transaction Transaction { get; set; } = null!;
}
