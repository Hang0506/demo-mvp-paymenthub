import { Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import PaymentPage from './pages/PaymentPage'
import PaymentResult from './pages/PaymentResult'
import PortalLayout from './pages/portal/PortalLayout'
import Dashboard from './pages/portal/Dashboard'
import TenantsPage from './pages/portal/TenantsPage'
import PaymentMethodsPage from './pages/portal/PaymentMethodsPage'
import ProvidersPage from './pages/portal/ProvidersPage'
import TestPaymentPage from './pages/portal/TestPaymentPage'
import TransactionsPage from './pages/portal/TransactionsPage'

function App() {
  return (
    <ConfigProvider theme={{
      token: {
        colorPrimary: '#667eea',
        borderRadius: 8,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
    }}>
      <Routes>
        {/* Portal */}
        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="tenants" element={<TenantsPage />} />
          <Route path="payment-methods" element={<PaymentMethodsPage />} />
          <Route path="providers" element={<ProvidersPage />} />
          <Route path="test-payment" element={<TestPaymentPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
        </Route>

        {/* Payment Page (customer-facing) */}
        <Route path="/payment/:paymentCode" element={<PaymentPage />} />
        <Route path="/payment/:paymentCode/result" element={<PaymentResult />} />
        <Route path="/payment/result" element={<PaymentResult />} />

        {/* Default → Portal */}
        <Route path="/" element={<Navigate to="/portal" replace />} />
      </Routes>
    </ConfigProvider>
  )
}

export default App