using System.ComponentModel.DataAnnotations;

namespace PaymentHub.Application.Contracts.Dtos
{
    /// <summary>
    /// Request DTO for ZaloPay webhook callback
    /// </summary>
    public class ZaloPayCallbackRequest
    {
        /// <summary>
        /// Callback type: 1 = payment success
        /// </summary>
        [Required]
        public int Type { get; set; }

        /// <summary>
        /// HMAC-SHA256 signature for callback verification
        /// </summary>
        [Required]
        public string Mac { get; set; }

        /// <summary>
        /// Callback data in JSON string format
        /// </summary>
        [Required]
        public string Data { get; set; }
    }

    /// <summary>
    /// Parsed callback data from ZaloPay
    /// ZaloPay gửi data dưới dạng JSON string với snake_case keys
    /// </summary>
    public class ZaloPayCallbackData
    {
        [System.Text.Json.Serialization.JsonPropertyName("app_id")]
        public string AppId { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("app_trans_id")]
        public string AppTransId { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("app_time")]
        public long AppTime { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("amount")]
        public long Amount { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("embed_data")]
        public string EmbedData { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("item")]
        public string Item { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("zp_trans_id")]
        public long ZpTransId { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("server_time")]
        public long ServerTime { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("channel")]
        public int Channel { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("merchant_user_id")]
        public string MerchantUserId { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("user_fee_amount")]
        public long UserFeeAmount { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("discount_amount")]
        public long DiscountAmount { get; set; }
    }
}
