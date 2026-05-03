using Volo.Abp.Threading;

namespace PaymentHub.EntityFrameworkCore;

public static class PaymentHubEfCoreEntityExtensionMappings
{
    private static readonly OneTimeRunner OneTimeRunner = new OneTimeRunner();

    public static void Configure()
    {
        OneTimeRunner.Run(() =>
        {
            // Configure EF Core entity extension mappings here
        });
    }
}