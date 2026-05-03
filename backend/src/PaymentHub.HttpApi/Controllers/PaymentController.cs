using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
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
    private readonly IConfiguration _configuration;

    public PaymentController(IPaymentAppService paymentAppService, IConfiguration configuration)
    {
        _paymentAppService = paymentAppService;
        _configuration = configuration;
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
    /// ZaloPay return URL handler — ZaloPay redirect browser về đây sau khi user thanh toán.
    /// Payment Hub cập nhật trạng thái split, sau đó redirect tiếp về merchant ReturnUrl.
    /// Flow: ZaloPay → POST /api/payments/{code}/zalopay-return → redirect → merchant app
    /// </summary>
    [HttpGet("{paymentCode}/zalopay-return")]
    public async Task<IActionResult> ZaloPayReturn(
        string paymentCode,
        [FromQuery] string? status,
        [FromQuery] string? apptransid,
        [FromQuery] string? checksum)
    {
        // Cập nhật trạng thái split nếu thành công (status=1)
        string? merchantReturnUrl = null;
        if (!string.IsNullOrEmpty(apptransid))
        {
            merchantReturnUrl = await _paymentAppService.HandleZaloPayReturnAsync(
                paymentCode, apptransid, status ?? "0");
        }

        // Luôn redirect về Payment Hub result page trước
        // Result page sẽ hiển thị trạng thái và tự redirect về merchant sau
        var paymentPageBase = _configuration["PaymentPageUrl"] ?? "http://localhost:3000";
        var resultStatus = status == "1" ? "success" : "failed";
        var redirectTo = $"{paymentPageBase}/payment/{paymentCode}/result?status={resultStatus}";
        if (!string.IsNullOrEmpty(merchantReturnUrl))
        {
            // Encode merchant URL để result page có thể redirect tiếp
            redirectTo += $"&returnUrl={Uri.EscapeDataString(merchantReturnUrl)}";
        }

        return Redirect(redirectTo);
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