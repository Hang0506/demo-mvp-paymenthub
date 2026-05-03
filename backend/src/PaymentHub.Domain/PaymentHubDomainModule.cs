using Volo.Abp.Domain;
using Volo.Abp.Modularity;

namespace PaymentHub;

[DependsOn(
    typeof(AbpDddDomainModule),
    typeof(PaymentHubDomainSharedModule)
)]
public class PaymentHubDomainModule : AbpModule
{
}
