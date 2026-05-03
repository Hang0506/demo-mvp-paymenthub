namespace PaymentHub.Core.Entities;

public class InboxEntry
{
    public Guid Id { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
    public string MessageType { get; set; } = string.Empty;
    public string MessageData { get; set; } = string.Empty;
    public bool Processed { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
}
