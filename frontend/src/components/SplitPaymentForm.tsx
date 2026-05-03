import React from 'react'
import { InputNumber, Typography } from 'antd'
import { CheckCircleFilled, ExclamationCircleFilled } from '@ant-design/icons'
import type { PaymentSplit } from '../types'

const { Text } = Typography

const METHOD_CFG: Record<string, { icon: string; label: string; color: string }> = {
  CASH:          { icon: '💵', label: 'Tiền mặt',     color: '#16a34a' },
  E_WALLET:      { icon: '📱', label: 'Ví điện tử',   color: '#2563eb' },
  BANK_TRANSFER: { icon: '🏦', label: 'Chuyển khoản', color: '#7c3aed' },
  CARD:          { icon: '💳', label: 'Thẻ ATM/Visa', color: '#ea580c' },
  ZALOPAY:       { icon: '💙', label: 'ZaloPay',      color: '#0068ff' },
  MOMO:          { icon: '💖', label: 'MoMo',         color: '#ae2070' },
  VNPAY:         { icon: '🏦', label: 'VNPay',        color: '#e31837' },
  NAPAS:         { icon: '📲', label: 'Napas VietQR', color: '#00a651' },
  ONEPAY:        { icon: '💳', label: 'OnePay',       color: '#d97706' },
}

interface Props {
  splits: PaymentSplit[]
  totalAmount: number
  onSplitChange: (splits: PaymentSplit[]) => void
}

const SplitPaymentForm: React.FC<Props> = ({ splits, totalAmount, onSplitChange }) => {
  const currentTotal = splits.reduce((s, x) => s + x.amount, 0)
  const isValid      = currentTotal === totalAmount
  const remaining    = totalAmount - currentTotal

  const handleChange = (methodId: string, val: number | null) => {
    onSplitChange(splits.map(s => s.methodId === methodId ? { ...s, amount: val ?? 0 } : s))
  }

  return (
    <div>
      <Text style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Phân chia số tiền
      </Text>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {splits.map(split => {
          const cfg = METHOD_CFG[split.methodId] ?? { icon: '💳', label: split.methodId, color: '#475569' }
          return (
            <div key={split.methodId} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', background: '#f8fafc', borderRadius: 10,
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{cfg.icon}</span>
                <Text strong style={{ fontSize: 14, color: '#0f172a' }}>{cfg.label}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <InputNumber
                  value={split.amount}
                  onChange={v => handleChange(split.methodId, v)}
                  min={0}
                  max={totalAmount}
                  step={1000}
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={v => Number(v!.replace(/,/g, ''))}
                  style={{ width: 140, borderRadius: 8 }}
                  size="middle"
                />
                <Text style={{ color: '#94a3b8', fontSize: 13 }}>₫</Text>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div style={{
        marginTop: 12, padding: '12px 16px',
        background: isValid ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : '#fff7ed',
        borderRadius: 10,
        border: `1px solid ${isValid ? '#86efac' : '#fed7aa'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isValid
            ? <CheckCircleFilled style={{ color: '#16a34a', fontSize: 16 }} />
            : <ExclamationCircleFilled style={{ color: '#ea580c', fontSize: 16 }} />
          }
          <Text style={{ fontSize: 13, color: isValid ? '#16a34a' : '#ea580c', fontWeight: 500 }}>
            {isValid
              ? 'Phân chia chính xác'
              : remaining > 0
                ? `Còn thiếu ${remaining.toLocaleString()}₫`
                : `Thừa ${Math.abs(remaining).toLocaleString()}₫`
            }
          </Text>
        </div>
        <Text strong style={{ fontSize: 14, color: '#0f172a' }}>
          {currentTotal.toLocaleString()} / {totalAmount.toLocaleString()}₫
        </Text>
      </div>
    </div>
  )
}

export default SplitPaymentForm
