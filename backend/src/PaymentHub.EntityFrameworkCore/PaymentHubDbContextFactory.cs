using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace PaymentHub.EntityFrameworkCore;

public class PaymentHubDbContextFactory : IDesignTimeDbContextFactory<PaymentHubDbContext>
{
    public PaymentHubDbContext CreateDbContext(string[] args)
    {
        var configuration = BuildConfiguration();
        var builder = new DbContextOptionsBuilder<PaymentHubDbContext>()
            .UseNpgsql(configuration.GetConnectionString("Default"));
        return new PaymentHubDbContext(builder.Options);
    }

    private static IConfigurationRoot BuildConfiguration()
    {
        var hostDir = Path.Combine(
            Directory.GetCurrentDirectory(),
            "../PaymentHub.HttpApi.Host");

        var builder = new ConfigurationBuilder()
            .SetBasePath(hostDir)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true);
        return builder.Build();
    }
}