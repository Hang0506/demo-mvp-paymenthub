using System.ComponentModel.DataAnnotations;

namespace PaymentHub.Application.Contracts.Dtos
{
    /// <summary>
    /// Request DTO for creating a ZaloPay order
    /// </summary>
    public class ZaloPayOrderRequest
    {
        /// <summary>
        /// ZaloPay App ID
        /// </summary>
        [Required]
        public int AppId { get; set; }

        /// <summary>
        /// User identifier in merchant system
        /// </summary>
        [Required]
        public string AppUser { get; set; }

        /// <summary>
        /// Unique transaction ID in format: yyMMdd_TransactionCode
        /// </summary>
        [Required]
        public string AppTransId { get; set; }

        /// <summary>
        /// Transaction timestamp in milliseconds
        /// </summary>
        [Required]
        public long AppTime { get; set; }

        /// <summary>
        /// Payment amount in VND
        /// </summary>
        [Required]
        public long Amount { get; set; }

        /// <summary>
        /// Order items in JSON array format
        /// </summary>
        public string Item { get; set; }

        /// <summary>
        /// Embedded data in JSON format (contains redirect URL, etc.)
        /// </summary>
        public string EmbedData { get; set; }

        /// <summary>
        /// Bank code for direct bank payment (empty for QR code)
        /// </summary>
        public string BankCode { get; set; }

        /// <summary>
        /// Payment description
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// HMAC-SHA256 signature for request verification
        /// </summary>
        [Required]
        public string Mac { get; set; }
    }
}
