using Microsoft.AspNetCore.Mvc;
using PaymentHub.Dtos;
using PaymentHub.Services;
using Volo.Abp.AspNetCore.Mvc;
using PaymentHub.Application.Contracts.Dtos;
using System.Text.Json;

namespace PaymentHub.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentController : AbpControllerBase
{
    private readonly IPaymentAppService _paymentAppService;

    public PaymentController(IPaymentAppService paymentAppService)
    {
        _paymentAppService = paymentAppService;
    }

    [HttpGet]
    public async Task<List<PaymentStatusResponse>> GetAllPaymentsAsync([FromQuery] string? tenantId)
    {
        return await _paymentAppService.GetAllPaymentsAsync(tenantId);
    }

    [HttpPost("{paymentCode}/refund")]
    public async Task<object> RefundPaymentAsync(string paymentCode, [FromBody] RefundRequest request)
    {
        return await _paymentAppService.RefundPaymentAsync(paymentCode, request.Reason ?? "Admin refund");
    }

    [HttpPost]
    public async Task<CreatePaymentResponse> CreatePaymentAsync(CreatePaymentRequest request)
    {
        return await _paymentAppService.CreatePaymentAsync(request);
    }

    [HttpGet("{paymentCode}/methods")]
    public async Task<GetPaymentMethodsResponse> GetPaymentMethodsAsync(string paymentCode)
    {
        return await _paymentAppService.GetPaymentMethodsAsync(paymentCode);
    }

    [HttpPost("{paymentCode}/submit")]
    public async Task<SubmitPaymentResponse> SubmitPaymentAsync(string paymentCode, SubmitPaymentRequest request)
    {
        return await _paymentAppService.SubmitPaymentAsync(paymentCode, request);
    }

    [HttpGet("{paymentCode}/status")]
    public async Task<PaymentStatusResponse> GetPaymentStatusAsync(string paymentCode)
    {
        return await _paymentAppService.GetPaymentStatusAsync(paymentCode);
    }

    /// <summary>
    /// ZaloPay return URL handler — được gọi khi user hoàn tất thanh toán trên ZaloPay
    /// và được redirect về. Cập nhật trạng thái split dựa trên status param.
    /// </summary>
    [HttpPost("{paymentCode}/zalopay-return")]
    public async Task<IActionResult> ZaloPayReturn(string paymentCode, [FromQuery] string? status, [FromQuery] string? apptransid, [FromQuery] string? checksum)
    {
        // status=1 là thành công theo ZaloPay docs
        if (status == "1" && !string.IsNullOrEmpty(apptransid))
        {
            await _paymentAppService.HandleZaloPayReturnAsync(paymentCode, apptransid, status);
        }
        return Ok(new { received = true });
    }

    /// <summary>
    /// Webhook endpoint for ZaloPay payment callback
    /// </summary>
    [HttpPost("zalopay/callback")]
    public async Task<IActionResult> ZaloPayCallback([FromBody] ZaloPayCallbackRequest request)
    {
        // Verify MAC signature
        var isValid = _paymentAppService.VerifyZaloPayCallback(request);
        if (!isValid)
        {
            return Ok(new { return_code = -1, return_message = "Invalid MAC" });
        }

        // Parse callback data
        var callbackData = JsonSerializer.Deserialize<ZaloPayCallbackData>(request.Data);
        if (callbackData == null)
        {
            return Ok(new { return_code = -1, return_message = "Invalid callback data" });
        }

        // Update payment status
        await _paymentAppService.HandleZaloPayCallbackAsync(callbackData);

        return Ok(new { return_code = 1, return_message = "Success" });
    }
}