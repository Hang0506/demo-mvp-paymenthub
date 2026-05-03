using System.Threading.Tasks;
using PaymentHub.Application.Contracts.Dtos;

namespace PaymentHub.Application.Services
{
    /// <summary>
    /// Service interface for ZaloPay payment integration
    /// </summary>
    public interface IZaloPayService
    {
        /// <summary>
        /// Creates a ZaloPay order and returns the payment URL
        /// </summary>
        /// <param name="request">ZaloPay order request containing payment details</param>
        /// <returns>ZaloPay order response with OrderUrl and transaction token</returns>
        Task<ZaloPayOrderResponse> CreateOrderAsync(ZaloPayOrderRequest request);
    }
}
