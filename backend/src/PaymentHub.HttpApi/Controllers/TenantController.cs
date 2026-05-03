using Microsoft.AspNetCore.Mvc;
using PaymentHub.Dtos;
using PaymentHub.Services;
using Volo.Abp.AspNetCore.Mvc;

namespace PaymentHub.Controllers;

[ApiController]
[Route("api/payment-tenants")]
public class TenantController : AbpControllerBase
{
    private readonly ITenantAppService _tenantAppService;

    public TenantController(ITenantAppService tenantAppService)
    {
        _tenantAppService = tenantAppService;
    }

    [HttpGet]
    public async Task<List<TenantDto>> GetTenantsAsync()
        => await _tenantAppService.GetTenantsAsync();

    [HttpPost]
    public async Task<object> CreateTenantAsync(CreateTenantRequest request)
        => await _tenantAppService.CreateTenantAsync(request);

    [HttpGet("{tenantId}/payment-methods")]
    public async Task<List<PaymentMethodDto>> GetPaymentMethodsAsync(string tenantId)
        => await _tenantAppService.GetPaymentMethodsAsync(tenantId);

    [HttpPost("{tenantId}/payment-methods")]
    public async Task<object> RegisterPaymentMethodsAsync(string tenantId, RegisterPaymentMethodsRequest request)
        => await _tenantAppService.RegisterPaymentMethodsAsync(tenantId, request);

    [HttpGet("{tenantId}/providers")]
    public async Task<List<ProviderConfigDto>> GetProvidersAsync(string tenantId)
        => await _tenantAppService.GetProvidersAsync(tenantId);

    [HttpPost("{tenantId}/providers/{providerId}")]
    public async Task<object> ConfigureProviderAsync(string tenantId, string providerId, ConfigureProviderRequest request)
        => await _tenantAppService.ConfigureProviderAsync(tenantId, providerId, request);

    // ─── Merchant endpoints ──────────────────────────────────────────────────

    [HttpGet("{tenantId}/merchants")]
    public async Task<List<MerchantDto>> GetMerchantsAsync(string tenantId)
        => await _tenantAppService.GetMerchantsAsync(tenantId);

    [HttpPost("{tenantId}/merchants")]
    public async Task<MerchantDto> CreateMerchantAsync(string tenantId, CreateMerchantRequest request)
        => await _tenantAppService.CreateMerchantAsync(tenantId, request);

    [HttpDelete("{tenantId}/merchants/{merchantId}")]
    public async Task DeleteMerchantAsync(string tenantId, Guid merchantId)
        => await _tenantAppService.DeleteMerchantAsync(tenantId, merchantId);
}