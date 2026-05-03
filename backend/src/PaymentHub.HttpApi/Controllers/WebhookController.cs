using Microsoft.AspNetCore.Mvc;
using PaymentHub.Services;
using System.Text.Json;
using Volo.Abp.AspNetCore.Mvc;

namespace PaymentHub.Controllers;

[ApiController]
[Route("api/webhooks")]
public class WebhookController : AbpControllerBase
{
    private readonly IWebhookAppService _webhookAppService;

    public WebhookController(IWebhookAppService webhookAppService)
    {
        _webhookAppService = webhookAppService;
    }

    [HttpPost("zalopay")]
    public async Task<IActionResult> ZaloPayAsync([FromBody] JsonElement payload)
    {
        var result = await _webhookAppService.ProcessZaloPayWebhookAsync(payload);
        return Ok(result);
    }

    [HttpPost("momo")]
    public async Task<IActionResult> MoMoAsync([FromBody] JsonElement payload)
    {
        var result = await _webhookAppService.ProcessMoMoWebhookAsync(payload);
        return Ok(result);
    }
}