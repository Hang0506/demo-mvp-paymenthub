using Microsoft.Extensions.DependencyInjection;
using Volo.Abp.AutoMapper;
using Volo.Abp.Modularity;
using Volo.Abp.Application;
using PaymentHub.Application.Services;
using PaymentHub.Application.Services.Adapters;
using PaymentHub.Interfaces;

namespace PaymentHub;

[DependsOn(
    typeof(PaymentHubDomainModule),
    typeof(PaymentHubApplicationContractsModule),
    typeof(AbpDddApplicationModule),
    typeof(AbpAutoMapperModule)
)]
public class PaymentHubApplicationModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        context.Services.AddAutoMapperObjectMapper<PaymentHubApplicationModule>();
        Configure<AbpAutoMapperOptions>(options =>
        {
            options.AddMaps<PaymentHubApplicationModule>(validate: false);
        });

        // KMS Service — mock for MVP, replace with real KMS in production
        context.Services.AddSingleton<IKmsService, MockKmsService>();

        // HttpClient cho ZaloPay API calls
        context.Services.AddHttpClient("zalopay");

        // HttpClient cho tenant webhook callbacks
        context.Services.AddHttpClient("webhook", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
        });

        // ZaloPay service (dùng bởi PaymentAppService)
        context.Services.AddTransient<IZaloPayService, MockZaloPayService>();

        // Provider Adapters — each implements IPaymentProviderAdapter + MapProviderStatus()
        context.Services.AddTransient<IPaymentProviderAdapter, ZaloPayProviderAdapter>();
        context.Services.AddTransient<IPaymentProviderAdapter, MoMoProviderAdapter>();
        context.Services.AddTransient<IPaymentProviderAdapter, VnPayProviderAdapter>();

        // Registry — resolves adapter by providerId
        context.Services.AddSingleton<IProviderAdapterRegistry, ProviderAdapterRegistry>();
    }
}