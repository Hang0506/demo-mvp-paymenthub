import axios from 'axios'
import type { 
  PaymentData, 
  SubmitPaymentRequest, 
  SubmitPaymentResponse,
  CreatePaymentRequest,
  CreatePaymentResponse
} from '../types'

const API_BASE_URL = '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data)
    return config
  },
  (error) => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data)
    return response
  },
  (error) => {
    console.error('Response Error:', error.response?.status, error.response?.data)
    return Promise.reject(error)
  }
)

export const paymentService = {
  // Create payment
  createPayment: async (request: CreatePaymentRequest): Promise<CreatePaymentResponse> => {
    const response = await apiClient.post('/payments', request)
    return response.data
  },

  // Get payment methods for a payment
  getPaymentMethods: async (paymentCode: string): Promise<PaymentData> => {
    const response = await apiClient.get(`/payments/${paymentCode}/methods`)
    return response.data
  },

  // Submit payment with splits
  submitPayment: async (paymentCode: string, request: SubmitPaymentRequest): Promise<SubmitPaymentResponse> => {
    const response = await apiClient.post(`/payments/${paymentCode}/submit`, request)
    return response.data
  },

  // Get payment status
  getPaymentStatus: async (paymentCode: string) => {
    const response = await apiClient.get(`/payments/${paymentCode}/status`)
    return response.data
  },
}

// Export individual functions for convenience
export const createPayment = paymentService.createPayment
export const getPaymentMethods = paymentService.getPaymentMethods
export const submitPayment = paymentService.submitPayment
export const getPaymentStatus = paymentService.getPaymentStatus

export default paymentService