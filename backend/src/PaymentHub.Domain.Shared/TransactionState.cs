namespace PaymentHub;

/// <summary>
/// Trạng thái giao dịch
/// </summary>
public enum TransactionState
{
    Created,
    PendingAuthorize,
    Authorized,
    Captured,
    Failed,
    Cancelled,
    Refunding,
    Refunded,
    Settled
}

/// <summary>
/// Loại hình thanh toán (Payment Method Type)
/// Đây là PTTT từ góc nhìn khách hàng, không phải provider cụ thể
/// </summary>
public enum PaymentMethodType
{
    Cash,           // Tiền mặt
    EWallet,        // Ví điện tử (ZaloPay, MoMo, ...)
    BankTransfer,   // Chuyển khoản ngân hàng
    Card,           // Thẻ ATM/Visa/Master
    QrCode,         // QR Code (VietQR, ...)
}

/// <summary>
/// Provider cụ thể xử lý thanh toán
/// </summary>
public enum PaymentProviderType
{
    Cash,       // Nội bộ, không cần provider
    ZaloPay,
    MoMo,
    VnPay,
    Napas,
    OnePay,
}