namespace PaymentHub.Application.Contracts.Dtos
{
    /// <summary>
    /// Response DTO from ZaloPay order creation
    /// </summary>
    public class ZaloPayOrderResponse
    {
        /// <summary>
        /// Return code: 1 = success, other values = error
        /// </summary>
        public int ReturnCode { get; set; }

        /// <summary>
        /// Return message describing the result
        /// </summary>
        public string ReturnMessage { get; set; }

        /// <summary>
        /// Sub return code for detailed error information
        /// </summary>
        public int SubReturnCode { get; set; }

        /// <summary>
        /// Sub return message for detailed error information
        /// </summary>
        public string SubReturnMessage { get; set; }

        /// <summary>
        /// Payment URL for user to complete payment
        /// </summary>
        public string OrderUrl { get; set; }

        /// <summary>
        /// ZaloPay transaction token
        /// </summary>
        public string ZpTransToken { get; set; }
    }
}
