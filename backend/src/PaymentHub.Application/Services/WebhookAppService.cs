using PaymentHub.Entities;
using PaymentHub.Services;
using System.Text.Json;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Text;

namespace PaymentHub.Application.Services;

public class WebhookAppService : ApplicationService, IWebhookAppService
{
    private readonly IRepository<PaymentSplit, Guid> _splitRepository;
    private readonly IRepository<InboxEntry, Guid> _inboxRepository;
    private readonly IRepository<Transaction, Guid> _transactionRepository;
    private readonly IRepository<Tenant, Guid> _tenantRepository;
    private readonly IHttpClientFactory _httpClientFactory;

    public WebhookAppService(
        IRepository<PaymentSplit, Guid> splitRepository,
        IRepository<InboxEntry, Guid> inboxRepository,
        IRepository<Transaction, Guid> transactionRepository,
        IRepository<Tenant, Guid> tenantRepository,
        IHttpClientFactory httpClientFactory)
    {
        _splitRepository = splitRepository;
        _inboxRepository = inboxRepository;
        _transactionRepository = transactionRepository;
        _tenantRepository = tenantRepository;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<object> ProcessZaloPayWebhookAsync(JsonElement payload)
    {
        var providerTxnId = payload.TryGetProperty("app_trans_id", out var v) ? v.GetString() : null;
        return await ProcessWebhookAsync("ZALOPAY", providerTxnId, payload.GetRawText());
    }

    public async Task<object> ProcessMoMoWebhookAsync(JsonElement payload)
    {
        var providerTxnId = payload.TryGetProperty("orderId", out var v) ? v.GetString() : null;
        return await ProcessWebhookAsync("MOMO", providerTxnId, payload.GetRawText());
    }

    private async Task<object> ProcessWebhookAsync(string providerId, string? providerTxnId, string rawData)
    {
        if (string.IsNullOrEmpty(providerTxnId))
            return new { error = "Missing transaction ID" };

        // Idempotency check
        var idempotencyKey = $"{providerId}:{providerTxnId}";
        var existing = await _inboxRepository.FirstOrDefaultAsync(e => e.IdempotencyKey == idempotencyKey);
        if (existing != null && existing.Processed)
        {
            Logger.LogInformation("Duplicate webhook ignored: {Key}", idempotencyKey);
            return new { status = "already_processed" };
        }

        // Save to inbox
        var inboxEntry = new InboxEntry(
            GuidGenerator.Create(),
            idempotencyKey,
            providerId,
            providerTxnId,
            rawData
        );
        await _inboxRepository.InsertAsync(inboxEntry);

        // Find and update the split
        var splits = await _splitRepository.GetListAsync(s => s.ProviderId == providerId);
        var split = splits.FirstOrDefault(s => s.State == TransactionState.PendingAuthorize);

        if (split != null)
        {
            split.ProviderTransactionId = providerTxnId;
            split.UpdateState(TransactionState.Captured);
            await _splitRepository.UpdateAsync(split);

            // Check if all splits captured → mark transaction PAID
            var allSplits = await _splitRepository.GetListAsync(s => s.TransactionId == split.TransactionId);
            if (allSplits.All(s => s.State == TransactionState.Captured))
            {
                var transaction = await _transactionRepository.GetAsync(split.TransactionId);
                transaction.UpdateState(TransactionState.Captured);
                await _transactionRepository.UpdateAsync(transaction);
                Logger.LogInformation("Transaction {Code} marked as PAID", transaction.PaymentRequestCode);

                // Notify tenant webhook
                await NotifyTenantAsync(transaction, allSplits);
            }
        }

        inboxEntry.MarkAsProcessed();
        await _inboxRepository.UpdateAsync(inboxEntry);

        return new { status = "success", return_code = 1 };
    }

    /// <summary>
    /// Gọi webhook về tenant backend sau khi payment PAID.
    /// Đây là bước quan trọng để tenant biết payment đã hoàn tất.
    /// </summary>
    private async Task NotifyTenantAsync(Transaction transaction, IList<PaymentSplit> splits)
    {
        var tenant = await _tenantRepository.FirstOrDefaultAsync(t => t.TenantId == transaction.TenantId);
        if (tenant == null || string.IsNullOrEmpty(tenant.WebhookUrl))
        {
            Logger.LogWarning("[Webhook] Tenant {TenantId} has no webhookUrl configured", transaction.TenantId);
            return;
        }

        var payload = new
        {
            paymentRequestCode = transaction.PaymentRequestCode,
            transactionCode    = transaction.TransactionCode,
            tenantId           = transaction.TenantId,
            orderCode          = transaction.OrderCode,
            status             = "PAID",
            amount             = transaction.Amount,
            paidAmount         = splits.Where(s => s.State == TransactionState.Captured).Sum(s => s.Amount),
            returnUrl          = transaction.ReturnUrl,
            completedAt        = transaction.CompletedAt,
            splits             = splits.Select(s => new
            {
                splitCode             = s.SplitCode,
                methodId              = s.MethodId,
                providerId            = s.ProviderId,
                amount                = s.Amount,
                status                = s.State.ToString(),
                providerTransactionId = s.ProviderTransactionId,
            })
        };

        try
        {
            var client = _httpClientFactory.CreateClient("webhook");
            var json   = JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");

            Logger.LogInformation("[Webhook] → POST {Url} | PaymentCode={Code}", tenant.WebhookUrl, transaction.PaymentRequestCode);
            var response = await client.PostAsync(tenant.WebhookUrl, content);
            Logger.LogInformation("[Webhook] ← {StatusCode} from {Url}", (int)response.StatusCode, tenant.WebhookUrl);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "[Webhook] Failed to notify tenant {TenantId} at {Url}", transaction.TenantId, tenant.WebhookUrl);
        }
    }
}