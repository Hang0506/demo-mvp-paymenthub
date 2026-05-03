export interface ProviderOption {
  providerId: string
  providerName: string
}

export interface PaymentMethod {
  methodId: string
  methodName: string
  iconUrl?: string
  enabled: boolean
  providers: ProviderOption[]  // provider con, rỗng nếu CASH
}

export interface PaymentSplit {
  methodId: string
  amount: number
}

export interface PaymentData {
  paymentRequestCode: string
  amount: number
  currency: string
  methods: PaymentMethod[]
}

export interface SubmitPaymentRequest {
  splits: PaymentSplit[]
}

export interface PaymentSplitResult {
  splitCode: string
  methodId: string
  amount: number
  status: string
  redirectUrl?: string
}

export interface SubmitPaymentResponse {
  transactionId: string
  status: string
  splits: PaymentSplitResult[]
}

export interface CustomerInfo {
  name: string
  phone: string
  email?: string
}

export interface CreatePaymentRequest {
  tenantId: string
  orderCode: string
  amount: number
  currency: string
  customerInfo?: CustomerInfo
  returnUrl: string
}

export interface CreatePaymentResponse {
  paymentRequestCode: string
  paymentUrl: string
  qrCode?: string
}