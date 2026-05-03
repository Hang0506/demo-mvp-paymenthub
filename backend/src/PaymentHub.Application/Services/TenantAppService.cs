using PaymentHub.Application.Services;
using PaymentHub.Dtos;
using PaymentHub.Entities;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace PaymentHub.Services;

public class TenantAppService : ApplicationService, ITenantAppService
{
    private readonly IRepository<Tenant, Guid> _tenantRepository;
    private readonly IRepository<PaymentMethod, Guid> _paymentMethodRepository;
    private readonly IRepository<ProviderConfig, Guid> _providerConfigRepository;
    private readonly IRepository<Merchant, Guid> _merchantRepository;
    private readonly IKmsService _kmsService;

    public TenantAppService(
        IRepository<Tenant, Guid> tenantRepository,
        IRepository<PaymentMethod, Guid> paymentMethodRepository,
        IRepository<ProviderConfig, Guid> providerConfigRepository,
        IRepository<Merchant, Guid> merchantRepository,
        IKmsService kmsService)
    {
        _tenantRepository = tenantRepository;
        _paymentMethodRepository = paymentMethodRepository;
        _providerConfigRepository = providerConfigRepository;
        _merchantRepository = merchantRepository;
        _kmsService = kmsService;
    }

    public async Task<List<TenantDto>> GetTenantsAsync()
    {
        var tenants = await _tenantRepository.GetListAsync();
        return tenants.OrderByDescending(t => t.CreationTime).Select(t => new TenantDto
        {
            TenantId = t.TenantId,
            TenantName = t.TenantName,
            WebhookUrl = t.WebhookUrl,
            Enabled = t.Enabled,
            CreatedAt = t.CreationTime,
        }).ToList();
    }

    public async Task<List<PaymentMethodDto>> GetPaymentMethodsAsync(string tenantId)
    {
        var methods = await _paymentMethodRepository.GetListAsync(m => m.TenantId == tenantId);
        return methods.Select(m => new PaymentMethodDto
        {
            MethodId = m.MethodId,
            MethodName = m.MethodName,
            Enabled = m.Enabled,
        }).ToList();
    }

    public async Task<List<ProviderConfigDto>> GetProvidersAsync(string tenantId)
    {
        var configs = await _providerConfigRepository.GetListAsync(p => p.TenantId == tenantId);
        return configs.Select(c => new ProviderConfigDto
        {
            ProviderId = c.ProviderId,
            MerchantId = c.MerchantId,
            ApiKeyRef = c.ApiKeyRef,
            Enabled = c.Enabled,
        }).ToList();
    }

    public async Task<object> CreateTenantAsync(CreateTenantRequest request)
    {
        var existing = await _tenantRepository.FirstOrDefaultAsync(t => t.TenantId == request.TenantId);
        if (existing != null)
        {
            throw new Volo.Abp.UserFriendlyException($"Tenant '{request.TenantId}' đã tồn tại. Vui lòng dùng Tenant ID khác.");
        }

        var tenant = new Tenant(GuidGenerator.Create(), request.TenantId, request.TenantName, request.WebhookUrl);
        await _tenantRepository.InsertAsync(tenant);
        return new { tenant.TenantId, tenant.TenantName };
    }

    public async Task<object> RegisterPaymentMethodsAsync(string tenantId, RegisterPaymentMethodsRequest request)
    {
        var existing = await _paymentMethodRepository.GetListAsync(m => m.TenantId == tenantId);
        foreach (var m in existing)
            await _paymentMethodRepository.DeleteAsync(m);

        foreach (var method in request.Methods)
        {
            var pm = new PaymentMethod(GuidGenerator.Create(), tenantId, method.MethodId, method.MethodName);
            pm.Enabled = method.Enabled;
            await _paymentMethodRepository.InsertAsync(pm);
        }

        return new { TenantId = tenantId, Methods = request.Methods.Select(m => m.MethodId) };
    }

    public async Task<object> ConfigureProviderAsync(string tenantId, string providerId, ConfigureProviderRequest request)
    {
        var existing = await _providerConfigRepository.FirstOrDefaultAsync(
            p => p.TenantId == tenantId && p.ProviderId == providerId);
        if (existing != null)
            await _providerConfigRepository.DeleteAsync(existing);

        // Store secrets in KMS (in-memory) AND also persist encrypted in ExtraConfig
        // This ensures secrets survive container restarts
        var apiKeyRef    = await _kmsService.StoreSecretAsync($"{tenantId}/{providerId}/api_key",    request.ApiKey);
        var secretKeyRef = await _kmsService.StoreSecretAsync($"{tenantId}/{providerId}/secret_key", request.SecretKey);

        var config = new ProviderConfig(GuidGenerator.Create(), tenantId, providerId, request.MerchantId, callbackUrl: "", returnUrl: "");
        // CallbackUrl: PaymentHub tự config ở portal provider
        // ReturnUrl: lấy từ Tenant.RedirectUrl khi tạo payment
        config.Enabled      = request.Enabled;
        config.ApiKeyRef    = apiKeyRef;
        config.SecretKeyRef = secretKeyRef;

        // Persist encrypted secrets + AppId/AppUser in ExtraConfig for restart resilience
        config.ExtraConfig = System.Text.Json.JsonSerializer.Serialize(new
        {
            encryptedApiKey    = _kmsService.Encrypt(request.ApiKey),
            encryptedSecretKey = _kmsService.Encrypt(request.SecretKey),
            appId              = request.MerchantId,
            appUser            = "PaymentHub",
        });

        await _providerConfigRepository.InsertAsync(config);

        return new
        {
            config.ProviderId,
            config.Enabled,
            apiKeyRef    = config.ApiKeyRef,
            secretKeyRef = config.SecretKeyRef,
            note = "Secrets stored in KMS + encrypted in DB for persistence."
        };
    }

    // ─── Merchant Methods ────────────────────────────────────────────────────

    public async Task<List<MerchantDto>> GetMerchantsAsync(string tenantId)
    {
        var merchants = await _merchantRepository.GetListAsync(m => m.TenantId == tenantId);
        return merchants.OrderBy(m => m.CreationTime).Select(m => new MerchantDto
        {
            Id = m.Id,
            MerchantCode = m.MerchantCode,
            MerchantName = m.MerchantName,
            RedirectUrl = m.RedirectUrl,
            Enabled = m.Enabled,
            CreatedAt = m.CreationTime,
        }).ToList();
    }

    public async Task<MerchantDto> CreateMerchantAsync(string tenantId, CreateMerchantRequest request)
    {
        var existing = await _merchantRepository.FirstOrDefaultAsync(
            m => m.TenantId == tenantId && m.MerchantCode == request.MerchantCode);
        if (existing != null)
            throw new Volo.Abp.UserFriendlyException($"Merchant code '{request.MerchantCode}' đã tồn tại trong tenant này.");

        var merchant = new Merchant(
            GuidGenerator.Create(),
            tenantId,
            request.MerchantCode,
            request.MerchantName,
            request.RedirectUrl
        );
        await _merchantRepository.InsertAsync(merchant);

        return new MerchantDto
        {
            Id = merchant.Id,
            MerchantCode = merchant.MerchantCode,
            MerchantName = merchant.MerchantName,
            RedirectUrl = merchant.RedirectUrl,
            Enabled = merchant.Enabled,
            CreatedAt = merchant.CreationTime,
        };
    }

    public async Task DeleteMerchantAsync(string tenantId, Guid merchantId)
    {
        var merchant = await _merchantRepository.FirstOrDefaultAsync(
            m => m.TenantId == tenantId && m.Id == merchantId);
        if (merchant == null)
            throw new Volo.Abp.UserFriendlyException("Merchant không tồn tại.");
        await _merchantRepository.DeleteAsync(merchant);
    }
}