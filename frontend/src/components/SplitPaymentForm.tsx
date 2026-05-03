import React from 'react'
import { Card, InputNumber, Typography, Space, Alert } from 'antd'
import type { PaymentSplit } from '../types'

const { Text } = Typography

const METHOD_DISPLAY: Record<string, { icon: string; label: string }> = {
  CASH:          { icon: '💵', label: 'Tiền mặt' },
  E_WALLET:      { icon: '📱', label: 'Ví điện tử' },
  BANK_TRANSFER: { icon: '🏦', label: 'Chuyển khoản' },
  CARD:          { icon: '💳', label: 'Thẻ ATM / Visa' },
  ZALOPAY:       { icon: '💙', label: 'ZaloPay' },
  MOMO:          { icon: '💖', label: 'MoMo' },
  VNPAY:         { icon: '🏦', label: 'VNPay' },
  NAPAS:         { icon: '📲', label: 'Napas VietQR' },
  ONEPAY:        { icon: '💳', label: 'OnePay' },
}

interface SplitPaymentFormProps {
  splits: PaymentSplit[]
  totalAmount: number
  onSplitChange: (splits: PaymentSplit[]) => void
}

const SplitPaymentForm: React.FC<SplitPaymentFormProps> = ({
  splits,
  totalAmount,
  onSplitChange,
}) => {
  const handleAmountChange = (methodId: string, amount: number | null) => {
    const newAmount = amount ?? 0
    onSplitChange(splits.map(s =>
      s.methodId === methodId ? { ...s, amount: newAmount } : s
    ))
  }

  const currentTotal = splits.reduce((sum, s) => sum + s.amount, 0)
  const isValid = currentTotal === totalAmount
  const remaining = totalAmount - currentTotal

  return (
    <div>
      <Text strong style={{ fontSize: 16, marginBottom: 16, display: 'block' }}>
        Phân chia số tiền thanh toán:
      </Text>

      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {splits.map(split => {
          const display = METHOD_DISPLAY[split.methodId] ?? { icon: '💳', label: split.methodId }
          return (
            <Card key={split.methodId} size="small">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space>
                  <span style={{ fontSize: 20 }}>{display.icon}</span>
                  <Text strong>{display.label}</Text>
                </Space>
                <Space>
                  <InputNumber
                    value={split.amount}
                    onChange={v => handleAmountChange(split.methodId, v)}
                    min={0}
                    max={totalAmount}
                    step={1000}
                    formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={v => Number(v!.replace(/,/g, ''))}
                    style={{ width: 150 }}
                  />
                  <Text type="secondary">VND</Text>
                </Space>
              </div>
            </Card>
          )
        })}
      </Space>

      <div style={{ marginTop: 16, padding: 12, background: '#fafafa', borderRadius: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text>Tổng tiền cần thanh toán:</Text>
          <Text strong>{totalAmount.toLocaleString()} VND</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text>Đã phân chia:</Text>
          <Text style={{ color: isValid ? '#52c41a' : '#ff4d4f' }}>
            {currentTotal.toLocaleString()} VND
          </Text>
        </div>
        {!isValid && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <Text>Còn lại:</Text>
            <Text type={remaining > 0 ? 'warning' : 'danger'}>
              {Math.abs(remaining).toLocaleString()} VND {remaining > 0 ? '(thiếu)' : '(thừa)'}
            </Text>
          </div>
        )}
      </div>

      {!isValid && (
        <Alert
          message={remaining > 0
            ? `Cần phân chia thêm ${remaining.toLocaleString()} VND`
            : `Đã phân chia thừa ${Math.abs(remaining).toLocaleString()} VND`}
          type={remaining > 0 ? 'warning' : 'error'}
          style={{ marginTop: 12 }}
        />
      )}
      {isValid && (
        <Alert message="✓ Phân chia số tiền chính xác!" type="success" style={{ marginTop: 12 }} />
      )}
    </div>
  )
}

export default SplitPaymentForm
