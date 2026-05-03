using System.Text.Json;
using Volo.Abp.Application.Services;

namespace PaymentHub.Services;

public interface IWebhookAppService : IApplicationService
{
    Task<object> ProcessZaloPayWebhookAsync(JsonElement payload);
    Task<object> ProcessMoMoWebhookAsync(JsonElement payload);
}