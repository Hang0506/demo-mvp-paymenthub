using PaymentHub.Dtos;
using Volo.Abp.Application.Services;

namespace PaymentHub.Services;

public interface ITenantAppService : IApplicationService
{
    Task<object> CreateTenantAsync(CreateTenantRequest request);
    Task<object> RegisterPaymentMethodsAsync(string tenantId, RegisterPaymentMethodsRequest request);
    Task<object> ConfigureProviderAsync(string tenantId, string providerId, ConfigureProviderRequest request);

    // GET endpoints
    Task<List<TenantDto>> GetTenantsAsync();
    Task<List<PaymentMethodDto>> GetPaymentMethodsAsync(string tenantId);
    Task<List<ProviderConfigDto>> GetProvidersAsync(string tenantId);

    // Merchant endpoints
    Task<List<MerchantDto>> GetMerchantsAsync(string tenantId);
    Task<MerchantDto> CreateMerchantAsync(string tenantId, CreateMerchantRequest request);
    Task DeleteMerchantAsync(string tenantId, Guid merchantId);
}