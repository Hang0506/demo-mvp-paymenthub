namespace PaymentHub.Core.Entities;

public class PaymentMethod
{
    public Guid Id { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public string MethodId { get; set; } = string.Empty;
    public string MethodName { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public bool Enabled { get; set; } = true;
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
