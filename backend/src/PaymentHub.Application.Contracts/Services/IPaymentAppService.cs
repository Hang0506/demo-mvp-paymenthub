using PaymentHub.Dtos;
using PaymentHub.Application.Contracts.Dtos;
using Volo.Abp.Application.Services;

namespace PaymentHub.Services;

public interface IPaymentAppService : IApplicationService
{
    Task<CreatePaymentResponse> CreatePaymentAsync(CreatePaymentRequest request);
    Task<GetPaymentMethodsResponse> GetPaymentMethodsAsync(string paymentCode);
    Task<SubmitPaymentResponse> SubmitPaymentAsync(string paymentCode, SubmitPaymentRequest request);
    Task<PaymentStatusResponse> GetPaymentStatusAsync(string paymentCode);
    Task<List<PaymentStatusResponse>> GetAllPaymentsAsync(string? tenantId);

    // Refund
    Task<object> RefundPaymentAsync(string paymentCode, string reason);
    
    // ZaloPay webhook methods
    bool VerifyZaloPayCallback(ZaloPayCallbackRequest request);
    Task HandleZaloPayCallbackAsync(ZaloPayCallbackData data);

    // ZaloPay return URL handler (khi user redirect về sau thanh toán)
    Task HandleZaloPayReturnAsync(string paymentCode, string appTransId, string status);
}