using PaymentHub.Interfaces;

namespace PaymentHub.Application.Services;

/// <summary>
/// Registry để lookup IPaymentProviderAdapter theo providerId.
/// Tất cả adapters được inject qua DI — thêm provider mới chỉ cần
/// tạo class mới implement IPaymentProviderAdapter và đăng ký trong DI.
/// </summary>
public class ProviderAdapterRegistry : IProviderAdapterRegistry
{
    private readonly Dictionary<string, IPaymentProviderAdapter> _adapters;

    public ProviderAdapterRegistry(IEnumerable<IPaymentProviderAdapter> adapters)
    {
        _adapters = adapters.ToDictionary(
            a => a.ProviderId.ToUpperInvariant(),
            a => a);
    }

    public IPaymentProviderAdapter GetAdapter(string providerId)
    {
        var key = providerId.ToUpperInvariant();
        if (_adapters.TryGetValue(key, out var adapter))
            return adapter;

        throw new InvalidOperationException(
            $"No adapter registered for provider '{providerId}'. " +
            $"Available: {string.Join(", ", _adapters.Keys)}");
    }

    public IEnumerable<IPaymentProviderAdapter> GetAllAdapters()
        => _adapters.Values;

    public void RegisterAdapter(IPaymentProviderAdapter adapter)
        => _adapters[adapter.ProviderId.ToUpperInvariant()] = adapter;
}
