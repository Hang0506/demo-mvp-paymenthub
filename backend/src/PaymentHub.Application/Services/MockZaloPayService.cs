using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PaymentHub.Application.Contracts.Dtos;

namespace PaymentHub.Application.Services
{
    /// <summary>
    /// Mock implementation of ZaloPay service for testing
    /// Does not require real ZaloPay credentials
    /// </summary>
    public class MockZaloPayService : IZaloPayService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<MockZaloPayService> _logger;
        private const string MockMacKey = "mock_mac_key_for_testing";

        public MockZaloPayService(IConfiguration configuration, ILogger<MockZaloPayService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Creates a mock ZaloPay order and returns a simulated payment URL
        /// Simulates calling ZaloPay API endpoint: POST https://sb-openapi.zalopay.vn/v2/create
        /// 
        /// Real ZaloPay API flow:
        /// 1. POST to https://sb-openapi.zalopay.vn/v2/create with order data
        /// 2. ZaloPay returns response with order_url like: https://gateway.zalopay.vn/openinapp?order=eyJ6cHRyYW5zdG9rZW4iOiJBQ0kyTVlNcFFOZUdUZFdMYmxoTWl2VkEiLCJhcHBpZCI6MjIzNn0=
        /// 3. This order_url is the actual payment link for user to complete payment
        /// 
        /// Mock implementation:
        /// - Simulates API call without real credentials
        /// - Returns order_url in correct ZaloPay format
        /// - Uses base64-encoded token to match real ZaloPay pattern
        /// </summary>
        public Task<ZaloPayOrderResponse> CreateOrderAsync(ZaloPayOrderRequest request)
        {
            _logger.LogInformation(
                "[ZaloPay] → POST https://sb-openapi.zalopay.vn/v2/create | AppTransId={AppTransId} Amount={Amount}",
                request.AppTransId, request.Amount);

            // Generate mock transaction token (ZaloPay returns this in response)
            var zpTransToken = Guid.NewGuid().ToString("N");

            // Generate MAC signature for the request (ZaloPay validates this)
            var mac = GenerateMac(request, MockMacKey);

            // Create mock order token (base64 encoded JSON like real ZaloPay)
            // Real format: {"zptranstoken":"AC2MYMpQNeGTdWLblhMivVA","appid":2236}
            var orderTokenData = System.Text.Json.JsonSerializer.Serialize(new
            {
                zptranstoken = zpTransToken,
                appid = request.AppId
            });
            var orderTokenBase64 = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(orderTokenData));

            // Mock OrderUrl - matches real ZaloPay format
            // Real ZaloPay returns: https://gateway.zalopay.vn/openinapp?order={base64_token}
            // Sandbox: https://sbgateway.zalopay.vn/openinapp?order={base64_token}
            var orderUrl = $"https://sbgateway.zalopay.vn/openinapp?order={orderTokenBase64}";

            // Return mock successful response (simulates ZaloPay API response)
            var response = new ZaloPayOrderResponse
            {
                ReturnCode = 1, // 1 = success (ZaloPay standard)
                ReturnMessage = "Success",
                SubReturnCode = 1,
                SubReturnMessage = "Success",
                OrderUrl = orderUrl,
                ZpTransToken = zpTransToken
            };

            _logger.LogInformation(
                "[ZaloPay] ← Response ReturnCode={ReturnCode} OrderUrl={OrderUrl} ZpTransToken={ZpTransToken}",
                response.ReturnCode, response.OrderUrl, response.ZpTransToken);

            return Task.FromResult(response);
        }

        /// <summary>
        /// Generates HMAC-SHA256 signature for ZaloPay request
        /// </summary>
        /// <param name="request">ZaloPay order request</param>
        /// <param name="macKey">MAC key for signature</param>
        /// <returns>HMAC-SHA256 signature in hexadecimal format</returns>
        private string GenerateMac(ZaloPayOrderRequest request, string macKey)
        {
            // Data format: AppId|AppTransId|AppUser|Amount|AppTime|EmbedData|Item
            var data = $"{request.AppId}|{request.AppTransId}|{request.AppUser}|{request.Amount}|{request.AppTime}|{request.EmbedData}|{request.Item}";

            using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(macKey)))
            {
                var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
                return BitConverter.ToString(hash).Replace("-", "").ToLower();
            }
        }

        /// <summary>
        /// Verifies MAC signature for ZaloPay callback
        /// </summary>
        /// <param name="data">Callback data string</param>
        /// <param name="receivedMac">MAC signature from callback</param>
        /// <returns>True if MAC is valid, false otherwise</returns>
        public bool VerifyCallbackMac(string data, string receivedMac)
        {
            using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(MockMacKey)))
            {
                var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
                var calculatedMac = BitConverter.ToString(hash).Replace("-", "").ToLower();
                return calculatedMac.Equals(receivedMac, StringComparison.OrdinalIgnoreCase);
            }
        }
    }
}
