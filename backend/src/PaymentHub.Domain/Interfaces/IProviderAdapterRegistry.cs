namespace PaymentHub.Interfaces;

public interface IProviderAdapterRegistry
{
    IPaymentProviderAdapter              GetAdapter(string providerId);
    IEnumerable<IPaymentProviderAdapter> GetAllAdapters();
    void                                 RegisterAdapter(IPaymentProviderAdapter adapter);
}
