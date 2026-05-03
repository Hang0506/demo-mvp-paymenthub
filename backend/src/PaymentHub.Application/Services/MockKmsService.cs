using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PaymentHub.Entities;
using Volo.Abp.Domain.Repositories;

namespace PaymentHub.Application.Services;

/// <summary>
/// KMS implementation cho MVP demo.
/// 
/// Strategy:
/// - StoreSecretAsync: AES-256 encrypt → lưu vào ProviderConfig.ExtraConfig (DB)
/// - GetSecretAsync: đọc từ DB → AES-256 decrypt → trả về plaintext
/// - Không dùng in-memory store → persist qua container restart
/// 
/// AES key/IV đọc từ appsettings.json (Kms:AesKey, Kms:AesIv) — KHÔNG hardcode.
/// Production replacement: AWS KMS, Azure Key Vault, HashiCorp Vault
/// </summary>
public class MockKmsService : IKmsService
{
    private readonly byte[] _aesKey;
    private readonly byte[] _aesIv;

    private readonly IRepository<ProviderConfig, Guid> _providerConfigRepository;
    private readonly ILogger<MockKmsService> _logger;

    public MockKmsService(
        IRepository<ProviderConfig, Guid> providerConfigRepository,
        ILogger<MockKmsService> logger,
        IConfiguration configuration)
    {
        _providerConfigRepository = providerConfigRepository;
        _logger = logger;

        var rawKey = configuration["Kms:AesKey"]
            ?? throw new InvalidOperationException("Kms:AesKey is not configured in appsettings.json");
        var rawIv = configuration["Kms:AesIv"]
            ?? throw new InvalidOperationException("Kms:AesIv is not configured in appsettings.json");

        _aesKey = Encoding.UTF8.GetBytes(rawKey.PadRight(32).Substring(0, 32));
        _aesIv  = Encoding.UTF8.GetBytes(rawIv.PadRight(16).Substring(0, 16));
    }

    /// <summary>
    /// Encrypt và trả về KMS ref. Caller tự lưu ref vào DB.
    /// Encrypted value được lưu vào ExtraConfig bởi TenantAppService.
    /// </summary>
    public Task<string> StoreSecretAsync(string keyName, string plainTextValue)
    {
        if (string.IsNullOrWhiteSpace(plainTextValue))
            return Task.FromResult(string.Empty);

        var kmsRef = $"kms://paymenthub/{keyName}";
        _logger.LogInformation("[KMS] Registered secret ref={KmsRef}", kmsRef);
        return Task.FromResult(kmsRef);
    }

    /// <summary>
    /// Lấy plaintext từ KMS ref bằng cách:
    /// 1. Parse ref để lấy tenantId + providerId + keyType
    /// 2. Đọc ProviderConfig từ DB
    /// 3. Decrypt từ ExtraConfig
    /// </summary>
    public async Task<string> GetSecretAsync(string kmsRef)
    {
        if (string.IsNullOrWhiteSpace(kmsRef))
            return string.Empty;

        // kmsRef format: kms://paymenthub/{tenantId}/{providerId}/{keyType}
        // e.g.: kms://paymenthub/ict/ZALOPAY/api_key
        var parts = kmsRef.Replace("kms://paymenthub/", "").Split('/');
        if (parts.Length < 3)
        {
            _logger.LogWarning("[KMS] Invalid ref format: {Ref}", kmsRef);
            return string.Empty;
        }

        var tenantId   = parts[0];
        var providerId = parts[1].ToUpperInvariant();
        var keyType    = parts[2]; // "api_key" or "secret_key"

        var config = await _providerConfigRepository.FirstOrDefaultAsync(
            p => p.TenantId == tenantId && p.ProviderId == providerId);

        if (config == null || string.IsNullOrEmpty(config.ExtraConfig))
        {
            _logger.LogWarning("[KMS] ProviderConfig not found for tenant={TenantId} provider={ProviderId}", tenantId, providerId);
            return string.Empty;
        }

        try
        {
            var extra = JsonSerializer.Deserialize<JsonElement>(config.ExtraConfig);
            var encryptedField = keyType == "api_key" ? "encryptedApiKey" : "encryptedSecretKey";

            if (!extra.TryGetProperty(encryptedField, out var encryptedEl))
                return string.Empty;

            var encrypted = encryptedEl.GetString();
            if (string.IsNullOrEmpty(encrypted)) return string.Empty;

            var plainText = Decrypt(encrypted);
            _logger.LogDebug("[KMS] Retrieved secret for ref={KmsRef}", kmsRef);
            return plainText;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[KMS] Failed to decrypt secret for ref={KmsRef}", kmsRef);
            return string.Empty;
        }
    }

    public Task DeleteSecretAsync(string kmsRef)
    {
        _logger.LogInformation("[KMS] Delete ref={KmsRef} (handled by DB cleanup)", kmsRef);
        return Task.CompletedTask;
    }

    // ── AES-256 helpers ──────────────────────────────────────────────────────

    public string Encrypt(string plainText)
    {
        using var aes = Aes.Create();
        aes.Key = _aesKey;
        aes.IV  = _aesIv;
        using var encryptor = aes.CreateEncryptor();
        var bytes = Encoding.UTF8.GetBytes(plainText);
        return Convert.ToBase64String(encryptor.TransformFinalBlock(bytes, 0, bytes.Length));
    }

    public string Decrypt(string cipherBase64)
    {
        using var aes = Aes.Create();
        aes.Key = _aesKey;
        aes.IV  = _aesIv;
        using var decryptor = aes.CreateDecryptor();
        var bytes = Convert.FromBase64String(cipherBase64);
        return Encoding.UTF8.GetString(decryptor.TransformFinalBlock(bytes, 0, bytes.Length));
    }
}
