import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'
import { Card, Result, Button, Spin, Typography, Descriptions } from 'antd'
import { getPaymentStatus } from '../services/paymentService'

const { Text } = Typography

const PaymentResult: React.FC = () => {
  const [searchParams] = useSearchParams()
  const { paymentCode } = useParams<{ paymentCode: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<any>(null)

  // ZaloPay return params
  const zpStatus   = searchParams.get('status')      // "1" = success, "-1" = fail
  const appTransId = searchParams.get('apptransid')
  const amount     = searchParams.get('amount')
  const checksum   = searchParams.get('checksum')

  // Internal params (navigate từ code)
  const internalStatus = searchParams.get('status')
  const transactionId  = searchParams.get('transactionId')

  const isZaloPayReturn = !!appTransId && !!checksum

  useEffect(() => {
    const init = async () => {
      try {
        if (paymentCode) {
          // Backend đã xử lý khi redirect từ /zalopay-return — chỉ cần lấy status
          const status = await getPaymentStatus(paymentCode)
          setPaymentStatus(status)

          // Nếu thanh toán thành công và có returnUrl → redirect về merchant
          // Append paymentCode để merchant biết đơn hàng nào
          if (status?.status === 'PAID' && status?.returnUrl) {
            const separator = status.returnUrl.includes('?') ? '&' : '?'
            const redirectTarget = `${status.returnUrl}${separator}paymentCode=${paymentCode}&status=success`
            // Delay nhỏ để user thấy kết quả trước khi redirect
            setTimeout(() => {
              window.location.href = redirectTarget
            }, 2000)
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const resolveResult = (): 'success' | 'failed' | 'pending' => {
    if (isZaloPayReturn) {
      if (zpStatus === '1') return 'success'
      if (zpStatus === '-1') return 'failed'
      return 'pending'
    }
    if (internalStatus === 'success') return 'success'
    if (internalStatus === 'failed') return 'failed'
    if (paymentStatus?.status === 'PAID') return 'success'
    if (paymentStatus?.status === 'FAILED') return 'failed'
    return 'pending'
  }

  const result = resolveResult()

  const configs = {
    success: { status: 'success' as const, title: 'Thanh toán thành công!', subTitle: paymentStatus?.returnUrl ? 'Giao dịch đã được xử lý thành công. Đang chuyển về trang merchant...' : 'Giao dịch đã được xử lý thành công.' },
    failed:  { status: 'error'   as const, title: 'Thanh toán thất bại!',   subTitle: 'Giao dịch không thể hoàn thành. Vui lòng thử lại.' },
    pending: { status: 'info'    as const, title: 'Đang xử lý...',          subTitle: 'Giao dịch đang được xử lý. Vui lòng đợi.' },
  }
  const cfg = configs[result]

  if (loading) {
    return (
      <div className="payment-container">
        <Card>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text>Đang xác nhận kết quả thanh toán...</Text>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="payment-container">
      <Card>
        <Result
          status={cfg.status}
          title={cfg.title}
          subTitle={cfg.subTitle}
          extra={[
            <Button type="primary" key="home" onClick={() => navigate('/')}>
              Về trang chủ
            </Button>,
            result === 'failed' && (
              <Button key="retry" onClick={() => window.history.back()}>
                Thử lại
              </Button>
            ),
          ].filter(Boolean)}
        />

        <Descriptions
          bordered
          size="small"
          column={1}
          style={{ marginTop: 24, maxWidth: 480, margin: '24px auto 0' }}
        >
          {paymentCode && (
            <Descriptions.Item label="Mã thanh toán">{paymentCode}</Descriptions.Item>
          )}
          {appTransId && (
            <Descriptions.Item label="Mã GD ZaloPay">{appTransId}</Descriptions.Item>
          )}
          {amount && (
            <Descriptions.Item label="Số tiền">
              {parseInt(amount).toLocaleString()} VND
            </Descriptions.Item>
          )}
          {transactionId && (
            <Descriptions.Item label="Transaction ID">{transactionId}</Descriptions.Item>
          )}
          {paymentStatus?.paidAmount != null && (
            <Descriptions.Item label="Đã thanh toán">
              {paymentStatus.paidAmount.toLocaleString()} VND
            </Descriptions.Item>
          )}
          {paymentStatus?.status && (
            <Descriptions.Item label="Trạng thái DB">{paymentStatus.status}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </div>
  )
}

export default PaymentResult
