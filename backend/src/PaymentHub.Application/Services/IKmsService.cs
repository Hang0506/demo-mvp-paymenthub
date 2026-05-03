namespace PaymentHub.Application.Services;

/// <summary>
/// Key Management Service interface.
/// Trong production: trỏ vào AWS KMS, Azure Key Vault, HashiCorp Vault, v.v.
/// Trong MVP demo: mock in-memory store để minh họa pattern.
/// 
/// Quy tắc: ApiKey và SecretKey KHÔNG BAO GIỜ lưu plaintext vào DB.
/// DB chỉ lưu KMS reference (kms://provider/key_name).
/// </summary>
public interface IKmsService
{
    /// <summary>
    /// Lưu secret vào KMS, trả về reference key (không phải plaintext).
    /// </summary>
    Task<string> StoreSecretAsync(string keyName, string plainTextValue);

    /// <summary>
    /// Lấy plaintext secret từ KMS reference.
    /// </summary>
    Task<string> GetSecretAsync(string kmsRef);

    /// <summary>
    /// Xóa secret khỏi KMS.
    /// </summary>
    Task DeleteSecretAsync(string kmsRef);
}
