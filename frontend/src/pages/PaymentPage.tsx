import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, message, Spin, Typography, Divider, Tag } from 'antd'
import { CheckCircleOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons'
import PaymentMethodSelector from '../components/PaymentMethodSelector'
import SplitPaymentForm from '../components/SplitPaymentForm'
import { getPaymentMethods, submitPayment, getPaymentStatus } from '../services/paymentService'
import type { PaymentMethod, PaymentSplit } from '../types'

const { Text } = Typography

export default function PaymentPage() {
  const { paymentCode } = useParams<{ paymentCode: string }>()
  const navigate = useNavigate()
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [selectedMethods, setSelectedMethods] = useState<PaymentMethod[]>([])
  const [splits, setSplits]         = useState<PaymentSplit[]>([])
  const [paidAmount, setPaidAmount] = useState(0)
  const [paidSplits, setPaidSplits] = useState<any[]>([])
  const [remainingAmount, setRemainingAmount] = useState(0)

  useEffect(() => { if (paymentCode) loadPage() }, [paymentCode])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('status') && params.get('apptransid') && paymentCode) {
      setTimeout(() => loadPage(), 1000)
    }
  }, [paymentCode])

  const loadPage = async () => {
    try {
      setLoading(true)
      const status = await getPaymentStatus(paymentCode!)
      if (status?.status === 'PAID') {
        navigate(`/payment/${paymentCode}/result?status=success`)
        return
      }
      const paid = status?.paidAmount ?? 0
      setPaidAmount(paid)
      setPaidSplits((status?.splits ?? []).filter((s: any) => s.status === 'Captured'))
      const data = await getPaymentMethods(paymentCode!)
      const remaining = data.amount - paid
      setRemainingAmount(remaining)
      setPaymentData({ ...data, amount: remaining })
    } catch {
      message.error('Không thể tải thông tin thanh toán')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (splits.length === 0) { message.warning('Vui lòng chọn phương thức thanh toán'); return }
    const total = splits.reduce((s, x) => s + x.amount, 0)
    if (total !== remainingAmount) { message.error(`Tổng phải bằng ${remainingAmount.toLocaleString()} VND`); return }
    try {
      setSubmitting(true)
      const result = await submitPayment(paymentCode!, { splits })
      const redirectSplit = result.splits.find((s: any) => s.redirectUrl)
      if (redirectSplit?.redirectUrl) {
        window.location.href = redirectSplit.redirectUrl
      } else {
        navigate(`/payment/${paymentCode}/result?status=success`)
      }
    } catch {
      message.error('Thanh toán thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="payment-wrapper">
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <Spin size="large" style={{ color: '#fff' }} />
          <div style={{ marginTop: 16, opacity: 0.8 }}>Đang tải...</div>
        </div>
      </div>
    )
  }

  if (!paymentData) {
    return (
      <div className="payment-wrapper">
        <div className="payment-card" style={{ padding: 40, textAlign: 'center' }}>
          <Text type="danger">Không tìm thấy thông tin thanh toán</Text>
        </div>
      </div>
    )
  }

  const isValid = splits.length > 0 && splits.reduce((s, x) => s + x.amount, 0) === remainingAmount

  return (
    <div className="payment-wrapper">
      <div className="payment-card">
        {/* Header */}
        <div className="payment-header">
          <div className="payment-header-logo">💳 Payment Hub</div>
          <div className="payment-header-amount">
            {remainingAmount.toLocaleString()}
            <span style={{ fontSize: 18, fontWeight: 400, marginLeft: 6, opacity: 0.8 }}>₫</span>
          </div>
          <div className="payment-header-sub">
            {paidAmount > 0
              ? `Còn lại · Đã thanh toán ${paidAmount.toLocaleString()}₫`
              : `Mã: ${paymentCode}`}
          </div>

          {/* Paid splits badges */}
          {paidSplits.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {paidSplits.map((s: any) => (
                <Tag
                  key={s.splitCode}
                  icon={<CheckCircleOutlined />}
                  style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 20 }}
                >
                  {s.methodId} {s.amount.toLocaleString()}₫
                </Tag>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="payment-body">
          <PaymentMethodSelector
            methods={paymentData.methods}
            selectedMethods={selectedMethods}
            onMethodSelect={(methods, newSplits) => { setSelectedMethods(methods); setSplits(newSplits) }}
            totalAmount={remainingAmount}
          />

          {selectedMethods.length > 0 && (
            <>
              <Divider style={{ margin: '20px 0' }} />
              <SplitPaymentForm
                splits={splits}
                totalAmount={remainingAmount}
                onSplitChange={setSplits}
              />
            </>
          )}

          <div style={{ marginTop: 24 }}>
            <Button
              className="pay-button"
              type="primary"
              size="large"
              loading={submitting}
              disabled={!isValid}
              onClick={handleSubmit}
            >
              {submitting ? 'Đang xử lý...' : `Thanh toán ${remainingAmount.toLocaleString()}₫`}
            </Button>
          </div>

          {/* Security badge */}
          <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <LockOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>Thanh toán bảo mật · Mã hóa SSL</Text>
            <SafetyOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
          </div>
        </div>
      </div>
    </div>
  )
}
