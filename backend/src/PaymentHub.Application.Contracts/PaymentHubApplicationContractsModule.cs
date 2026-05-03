using Volo.Abp.Application;
using Volo.Abp.Modularity;
using Volo.Abp.Authorization;

namespace PaymentHub;

[DependsOn(
    typeof(PaymentHubDomainSharedModule),
    typeof(AbpDddApplicationContractsModule),
    typeof(AbpAuthorizationModule)
)]
public class PaymentHubApplicationContractsModule : AbpModule
{
}
