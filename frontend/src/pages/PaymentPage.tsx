import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, message, Spin, Typography, Divider, Tag, Alert } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import PaymentMethodSelector from '../components/PaymentMethodSelector'
import SplitPaymentForm from '../components/SplitPaymentForm'
import { getPaymentMethods, submitPayment, getPaymentStatus } from '../services/paymentService'
import type { PaymentMethod, PaymentSplit } from '../types'

const { Title, Text } = Typography

export default function PaymentPage() {
  const { paymentCode } = useParams<{ paymentCode: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [selectedMethods, setSelectedMethods] = useState<PaymentMethod[]>([])
  const [splits, setSplits] = useState<PaymentSplit[]>([])

  // Trạng thái partial payment
  const [paidAmount, setPaidAmount] = useState(0)
  const [paidSplits, setPaidSplits] = useState<any[]>([])
  const [remainingAmount, setRemainingAmount] = useState(0)

  useEffect(() => {
    if (paymentCode) loadPage()
  }, [paymentCode])

  const loadPage = async () => {
    try {
      setLoading(true)

      // Lấy trạng thái hiện tại
      const status = await getPaymentStatus(paymentCode!)

      // Đã thanh toán đủ → redirect result
      if (status?.status === 'PAID') {
        navigate(`/payment/${paymentCode}/result?status=success`)
        return
      }

      // Tính phần đã thanh toán và còn lại
      const paid = status?.paidAmount ?? 0
      const capturedSplits = (status?.splits ?? []).filter((s: any) => s.status === 'Captured')
      setPaidAmount(paid)
      setPaidSplits(capturedSplits)

      // Load payment methods
      const data = await getPaymentMethods(paymentCode!)

      // Tổng còn lại = tổng - đã thanh toán
      const remaining = data.amount - paid
      setRemainingAmount(remaining)
      setPaymentData({ ...data, amount: remaining }) // chỉ hiện số tiền còn lại
    } catch {
      message.error('Không thể tải thông tin thanh toán')
    } finally {
      setLoading(false)
    }
  }

  const handleMethodSelect = (methods: PaymentMethod[], newSplits: PaymentSplit[]) => {
    setSelectedMethods(methods)
    setSplits(newSplits)
  }

  const handleSubmit = async () => {
    if (splits.length === 0) {
      message.warning('Vui lòng chọn phương thức thanh toán')
      return
    }
    const total = splits.reduce((s, x) => s + x.amount, 0)
    if (total !== remainingAmount) {
      message.error(`Tổng phải bằng ${remainingAmount.toLocaleString()} VND`)
      return
    }
    try {
      setSubmitting(true)
      const result = await submitPayment(paymentCode!, { splits })
      const redirectSplit = result.splits.find((s: any) => s.redirectUrl)
      if (redirectSplit?.redirectUrl) {
        // Redirect trực tiếp — không mở tab mới
        window.location.href = redirectSplit.redirectUrl
      } else {
        message.success('Thanh toán thành công!')
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
      <div className="payment-container">
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Đang tải...</div>
        </div>
      </div>
    )
  }

  if (!paymentData) {
    return (
      <div className="payment-container">
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Text type="danger">Không tìm thấy thông tin thanh toán</Text>
        </div>
      </div>
    )
  }

  return (
    <div className="payment-container">
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3}>Thanh Toán</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>Mã: {paymentCode}</Text>
        </div>

        {/* Hiển thị phần đã thanh toán nếu có */}
        {paidSplits.length > 0 && (
          <Alert
            style={{ marginBottom: 16 }}
            type="success"
            showIcon
            message={
              <span>
                Đã thanh toán: <strong>{paidAmount.toLocaleString()} VND</strong>
                {paidSplits.map((s: any) => (
                  <Tag key={s.splitCode} icon={<CheckCircleOutlined />} color="success" style={{ marginLeft: 8 }}>
                    {s.methodId} {s.amount.toLocaleString()}đ
                  </Tag>
                ))}
              </span>
            }
          />
        )}

        {/* Số tiền còn lại cần thanh toán */}
        <div className="total-display">
          {remainingAmount.toLocaleString()} {paymentData.currency}
          {paidAmount > 0 && (
            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
              (còn lại / tổng {(paidAmount + remainingAmount).toLocaleString()} VND)
            </div>
          )}
        </div>

        <Divider />

        <PaymentMethodSelector
          methods={paymentData.methods}
          selectedMethods={selectedMethods}
          onMethodSelect={handleMethodSelect}
          totalAmount={remainingAmount}
        />

        {selectedMethods.length > 0 && (
          <>
            <Divider />
            <SplitPaymentForm
              splits={splits}
              totalAmount={remainingAmount}
              onSplitChange={setSplits}
            />
          </>
        )}

        <div style={{ marginTop: 24 }}>
          <Button
            type="primary"
            size="large"
            className="submit-button"
            loading={submitting}
            disabled={splits.length === 0}
            onClick={handleSubmit}
          >
            {submitting ? 'Đang xử lý...' : 'Thanh Toán'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
