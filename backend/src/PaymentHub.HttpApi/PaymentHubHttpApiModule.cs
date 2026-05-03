using Volo.Abp.AspNetCore.Mvc;
using Volo.Abp.Modularity;
using Microsoft.Extensions.DependencyInjection;

namespace PaymentHub;

[DependsOn(
    typeof(PaymentHubApplicationContractsModule),
    typeof(AbpAspNetCoreMvcModule))]
public class PaymentHubHttpApiModule : AbpModule
{
    public override void PreConfigureServices(ServiceConfigurationContext context)
    {
        PreConfigure<IMvcBuilder>(mvcBuilder =>
        {
            mvcBuilder.AddApplicationPartIfNotExists(typeof(PaymentHubHttpApiModule).Assembly);
        });
    }
}