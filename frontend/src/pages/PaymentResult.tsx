import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import { Button, Spin, Typography } from 'antd'
import { CheckCircleFilled, CloseCircleFilled, SyncOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { getPaymentStatus } from '../services/paymentService'

const { Text } = Typography

const PaymentResult: React.FC = () => {
  const [searchParams]  = useSearchParams()
  const { paymentCode } = useParams<{ paymentCode: string }>()
  const navigate        = useNavigate()
  const [loading, setLoading]             = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<any>(null)

  const zpStatus       = searchParams.get('status')
  const appTransId     = searchParams.get('apptransid')
  const internalStatus = searchParams.get('status')
  const isZaloPayReturn = !!appTransId && !!searchParams.get('checksum')

  useEffect(() => {
    const init = async () => {
      try {
        if (paymentCode) {
          const status = await getPaymentStatus(paymentCode)
          setPaymentStatus(status)
          if (status?.status === 'PAID' && status?.returnUrl) {
            const sep = status.returnUrl.includes('?') ? '&' : '?'
            setTimeout(() => { window.location.href = `${status.returnUrl}${sep}paymentCode=${paymentCode}&status=success` }, 2500)
          }
        }
      } catch {}
      finally { setLoading(false) }
    }
    init()
  }, [])

  const resolveResult = (): 'success' | 'failed' | 'pending' => {
    if (isZaloPayReturn) return zpStatus === '1' ? 'success' : zpStatus === '-1' ? 'failed' : 'pending'
    if (internalStatus === 'success') return 'success'
    if (internalStatus === 'failed')  return 'failed'
    if (paymentStatus?.status === 'PAID')   return 'success'
    if (paymentStatus?.status === 'FAILED') return 'failed'
    return 'pending'
  }

  const result = resolveResult()

  const CONFIGS = {
    success: {
      icon: <CheckCircleFilled style={{ fontSize: 64, color: '#16a34a' }} />,
      title: 'Thanh toán thành công!',
      sub: paymentStatus?.returnUrl ? 'Đang chuyển về trang đơn hàng...' : 'Giao dịch đã được xử lý.',
      bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      border: '#86efac',
    },
    failed: {
      icon: <CloseCircleFilled style={{ fontSize: 64, color: '#dc2626' }} />,
      title: 'Thanh toán thất bại',
      sub: 'Giao dịch không thể hoàn thành. Vui lòng thử lại.',
      bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
      border: '#fca5a5',
    },
    pending: {
      icon: <SyncOutlined spin style={{ fontSize: 64, color: '#667eea' }} />,
      title: 'Đang xử lý...',
      sub: 'Giao dịch đang được xác nhận.',
      bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      border: '#c4b5fd',
    },
  }

  const cfg = CONFIGS[result]

  if (loading) {
    return (
      <div className="payment-wrapper">
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, opacity: 0.8 }}>Đang xác nhận...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="payment-wrapper">
      <div className="payment-card">
        {/* Header */}
        <div className="payment-header">
          <div className="payment-header-logo">💳 Payment Hub</div>
          <div className="payment-header-sub" style={{ opacity: 0.8 }}>Kết quả giao dịch</div>
        </div>

        {/* Result */}
        <div style={{ padding: '32px 28px 28px', textAlign: 'center' }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: cfg.bg, border: `2px solid ${cfg.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            {cfg.icon}
          </div>

          <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
            {cfg.title}
          </div>
          <Text style={{ color: '#64748b', fontSize: 14 }}>{cfg.sub}</Text>

          {/* Amount */}
          {paymentStatus?.paidAmount > 0 && (
            <div style={{
              margin: '20px 0',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
            }}>
              <Text style={{ color: '#94a3b8', fontSize: 12, display: 'block', marginBottom: 4 }}>Số tiền đã thanh toán</Text>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>
                {paymentStatus.paidAmount.toLocaleString()}₫
              </div>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>Mã: {paymentCode}</Text>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            {result === 'failed' && (
              <Button
                size="large"
                icon={<ArrowLeftOutlined />}
                onClick={() => window.history.back()}
                style={{ flex: 1, borderRadius: 10, height: 46 }}
              >
                Thử lại
              </Button>
            )}
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/')}
              style={{
                flex: 1, height: 46, borderRadius: 10,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              Về trang chủ
            </Button>
          </div>

          {/* Security */}
          <Text style={{ color: '#cbd5e1', fontSize: 11, display: 'block', marginTop: 16 }}>
            🔒 Giao dịch được bảo mật bởi Payment Hub
          </Text>
        </div>
      </div>
    </div>
  )
}

export default PaymentResult
