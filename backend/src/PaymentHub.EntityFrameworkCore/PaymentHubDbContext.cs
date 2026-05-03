using Microsoft.EntityFrameworkCore;
using PaymentHub.Entities;
using Volo.Abp.Data;
using Volo.Abp.EntityFrameworkCore;

namespace PaymentHub.EntityFrameworkCore;

[ConnectionStringName("Default")]
public class PaymentHubDbContext : AbpDbContext<PaymentHubDbContext>
{
    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<PaymentMethod> PaymentMethods { get; set; }
    public DbSet<ProviderConfig> ProviderConfigs { get; set; }
    public DbSet<Merchant> Merchants { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<PaymentSplit> PaymentSplits { get; set; }
    public DbSet<TransactionEvent> TransactionEvents { get; set; }
    public DbSet<InboxEntry> InboxEntries { get; set; }

    public PaymentHubDbContext(DbContextOptions<PaymentHubDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.ConfigurePaymentHub();
    }
}