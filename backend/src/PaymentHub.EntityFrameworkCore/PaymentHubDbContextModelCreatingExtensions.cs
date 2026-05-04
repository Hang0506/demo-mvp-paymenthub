using Microsoft.EntityFrameworkCore;
using PaymentHub.Entities;
using Volo.Abp;
using Volo.Abp.EntityFrameworkCore.Modeling;

namespace PaymentHub.EntityFrameworkCore;

public static class PaymentHubDbContextModelCreatingExtensions
{
    public static void ConfigurePaymentHub(this ModelBuilder builder)
    {
        Check.NotNull(builder, nameof(builder));

        // Tenant
        builder.Entity<Tenant>(b =>
        {
            b.ToTable("Tenants");
            b.ConfigureByConvention();
            
            b.Property(x => x.TenantId).IsRequired().HasMaxLength(50);
            b.Property(x => x.TenantName).IsRequired().HasMaxLength(200);
            b.Property(x => x.WebhookUrl).HasMaxLength(500);
            
            b.HasIndex(x => x.TenantId).IsUnique();
        });

        // Merchant — web/app của Tenant, mỗi merchant có redirect URL riêng
        builder.Entity<Merchant>(b =>
        {
            b.ToTable("Merchants");
            b.ConfigureByConvention();

            b.Property(x => x.TenantId).IsRequired().HasMaxLength(50);
            b.Property(x => x.MerchantCode).IsRequired().HasMaxLength(100);
            b.Property(x => x.MerchantName).IsRequired().HasMaxLength(200);
            b.Property(x => x.RedirectUrl).IsRequired().HasMaxLength(500);

            b.HasIndex(x => new { x.TenantId, x.MerchantCode }).IsUnique();
        });

        // PaymentMethod
        builder.Entity<PaymentMethod>(b =>
        {
            b.ToTable("PaymentMethods");
            b.ConfigureByConvention();
            
            b.Property(x => x.TenantId).IsRequired().HasMaxLength(50);
            b.Property(x => x.MerchantCode).HasMaxLength(100);
            b.Property(x => x.MethodId).IsRequired().HasMaxLength(50);
            b.Property(x => x.MethodName).IsRequired().HasMaxLength(200);
            b.Property(x => x.IconUrl).HasMaxLength(500);
            
            b.HasIndex(x => new { x.TenantId, x.MerchantCode, x.MethodId }).IsUnique();
        });

        // ProviderConfig
        builder.Entity<ProviderConfig>(b =>
        {
            b.ToTable("ProviderConfigs");
            b.ConfigureByConvention();
            
            b.Property(x => x.TenantId).IsRequired().HasMaxLength(50);
            b.Property(x => x.ProviderId).IsRequired().HasMaxLength(50);
            b.Property(x => x.MerchantId).IsRequired().HasMaxLength(100);
            b.Property(x => x.ApiKeyRef).HasMaxLength(200);
            b.Property(x => x.SecretKeyRef).HasMaxLength(200);
            b.Property(x => x.CallbackUrl).HasMaxLength(500);
            b.Property(x => x.ReturnUrl).HasMaxLength(500);
            
            b.HasIndex(x => new { x.TenantId, x.ProviderId }).IsUnique();
        });

        // Transaction
        builder.Entity<Transaction>(b =>
        {
            b.ToTable("Transactions");
            b.ConfigureByConvention();
            
            b.Property(x => x.TransactionCode).IsRequired().HasMaxLength(50);
            b.Property(x => x.PaymentRequestCode).IsRequired().HasMaxLength(50);
            b.Property(x => x.TenantId).IsRequired().HasMaxLength(50);
            b.Property(x => x.OrderCode).IsRequired().HasMaxLength(100);
            b.Property(x => x.Currency).IsRequired().HasMaxLength(3);
            b.Property(x => x.CustomerInfo).HasMaxLength(1000);
            b.Property(x => x.ReturnUrl).HasMaxLength(500);
            
            b.HasIndex(x => x.TransactionCode).IsUnique();
            b.HasIndex(x => x.PaymentRequestCode).IsUnique();
        });

        // PaymentSplit
        builder.Entity<PaymentSplit>(b =>
        {
            b.ToTable("PaymentSplits");
            b.ConfigureByConvention();
            
            b.Property(x => x.SplitCode).IsRequired().HasMaxLength(50);
            b.Property(x => x.MethodId).IsRequired().HasMaxLength(50);
            b.Property(x => x.ProviderId).HasMaxLength(50);
            b.Property(x => x.ProviderOrderId).HasMaxLength(100);
            b.Property(x => x.ProviderTransactionId).HasMaxLength(100);
            b.Property(x => x.RedirectUrl).HasMaxLength(500);
            
            b.HasIndex(x => x.SplitCode).IsUnique();
            b.HasOne<Transaction>().WithMany().HasForeignKey(x => x.TransactionId);
        });

        // TransactionEvent
        builder.Entity<TransactionEvent>(b =>
        {
            b.ToTable("TransactionEvents");
            b.ConfigureByConvention();
            
            b.Property(x => x.EventType).IsRequired().HasMaxLength(50);
            b.Property(x => x.EventData).HasMaxLength(2000);
            
            b.HasOne<Transaction>().WithMany().HasForeignKey(x => x.TransactionId);
        });

        // InboxEntry
        builder.Entity<InboxEntry>(b =>
        {
            b.ToTable("InboxEntries");
            b.ConfigureByConvention();
            
            b.Property(x => x.IdempotencyKey).IsRequired().HasMaxLength(100);
            b.Property(x => x.ProviderId).IsRequired().HasMaxLength(50);
            b.Property(x => x.ProviderTransactionId).IsRequired().HasMaxLength(100);
            b.Property(x => x.WebhookData).HasMaxLength(2000);
            
            b.HasIndex(x => x.IdempotencyKey).IsUnique();
        });
    }
}