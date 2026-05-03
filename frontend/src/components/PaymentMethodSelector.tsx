import { useState } from 'react'
import { Radio, Typography, Space } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import type { PaymentMethod, PaymentSplit } from '../types'

const { Text } = Typography

const METHOD_CFG: Record<string, { icon: string; label: string; bg: string; color: string }> = {
  CASH:          { icon: '💵', label: 'Tiền mặt',       bg: '#f0fdf4', color: '#16a34a' },
  E_WALLET:      { icon: '📱', label: 'Ví điện tử',     bg: '#eff6ff', color: '#2563eb' },
  BANK_TRANSFER: { icon: '🏦', label: 'Chuyển khoản',   bg: '#faf5ff', color: '#7c3aed' },
  CARD:          { icon: '💳', label: 'Thẻ ATM/Visa',   bg: '#fff7ed', color: '#ea580c' },
  ZALOPAY:       { icon: '💙', label: 'ZaloPay',        bg: '#eff6ff', color: '#0068ff' },
  MOMO:          { icon: '💖', label: 'MoMo',           bg: '#fdf2f8', color: '#ae2070' },
  VNPAY:         { icon: '🏦', label: 'VNPay',          bg: '#fff1f2', color: '#e31837' },
  NAPAS:         { icon: '📲', label: 'Napas VietQR',   bg: '#f0fdf4', color: '#00a651' },
  ONEPAY:        { icon: '💳', label: 'OnePay',         bg: '#fffbeb', color: '#d97706' },
}

interface Props {
  methods: PaymentMethod[]
  selectedMethods: PaymentMethod[]
  onMethodSelect: (methods: PaymentMethod[], splits: PaymentSplit[], total: number) => void
  totalAmount: number
}

export default function PaymentMethodSelector({ methods, selectedMethods, onMethodSelect, totalAmount }: Props) {
  const [selectedProviders, setSelectedProviders] = useState<Record<string, string>>({})

  const isChecked = (id: string) => selectedMethods.some(m => m.methodId === id)

  const buildSplits = (ms: PaymentMethod[], providers: Record<string, string>): PaymentSplit[] => {
    if (!ms.length) return []
    const per = Math.floor(totalAmount / ms.length)
    const rem = totalAmount % ms.length
    return ms.map((m, i) => ({
      methodId: m.providers.length > 0 ? (providers[m.methodId] ?? m.providers[0].providerId) : m.methodId,
      amount: per + (i === 0 ? rem : 0),
    }))
  }

  const toggle = (method: PaymentMethod, checked: boolean) => {
    let newProviders = selectedProviders
    if (checked && method.providers.length > 0 && !selectedProviders[method.methodId]) {
      newProviders = { ...selectedProviders, [method.methodId]: method.providers[0].providerId }
      setSelectedProviders(newProviders)
    }
    const newSelected = checked
      ? [...selectedMethods, method]
      : selectedMethods.filter(m => m.methodId !== method.methodId)
    onMethodSelect(newSelected, buildSplits(newSelected, newProviders), totalAmount)
  }

  const selectProvider = (method: PaymentMethod, providerId: string) => {
    const newProviders = { ...selectedProviders, [method.methodId]: providerId }
    setSelectedProviders(newProviders)
    onMethodSelect(selectedMethods, buildSplits(selectedMethods, newProviders), totalAmount)
  }

  return (
    <div>
      <Text style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Phương thức thanh toán
      </Text>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {methods.map(method => {
          const cfg = METHOD_CFG[method.methodId] ?? { icon: '💳', label: method.methodName, bg: '#f8fafc', color: '#475569' }
          const checked = isChecked(method.methodId)
          const chosenProvider = selectedProviders[method.methodId] ?? method.providers[0]?.providerId

          return (
            <div
              key={method.methodId}
              className={`method-card ${checked ? 'selected' : ''}`}
              onClick={() => toggle(method, !checked)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Icon */}
                <div className="method-icon" style={{ background: cfg.bg }}>
                  {cfg.icon}
                </div>

                {/* Label */}
                <div style={{ flex: 1 }}>
                  <Text strong style={{ fontSize: 14, color: '#0f172a' }}>{cfg.label}</Text>
                  {method.providers.length > 0 && (
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>
                      {method.providers.map(p => METHOD_CFG[p.providerId]?.label ?? p.providerName).join(' · ')}
                    </div>
                  )}
                </div>

                {/* Checkbox */}
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  border: `2px solid ${checked ? '#667eea' : '#d1d5db'}`,
                  background: checked ? '#667eea' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0,
                }}>
                  {checked && <CheckOutlined style={{ color: '#fff', fontSize: 11 }} />}
                </div>
              </div>

              {/* Provider selector */}
              {checked && method.providers.length > 0 && (
                <div
                  style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e2e8f0', paddingLeft: 52 }}
                  onClick={e => e.stopPropagation()}
                >
                  <Text style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Chọn cổng:</Text>
                  <Radio.Group value={chosenProvider} onChange={e => selectProvider(method, e.target.value)}>
                    <Space size={12}>
                      {method.providers.map(p => {
                        const pd = METHOD_CFG[p.providerId] ?? { icon: '💳', label: p.providerName }
                        return (
                          <Radio key={p.providerId} value={p.providerId}>
                            <Space size={4}>
                              <span>{pd.icon}</span>
                              <Text style={{ fontSize: 13 }}>{pd.label}</Text>
                            </Space>
                          </Radio>
                        )
                      })}
                    </Space>
                  </Radio.Group>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selectedMethods.length > 1 && (
        <div style={{
          marginTop: 12, padding: '10px 14px',
          background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
          borderRadius: 10, border: '1px solid #c4b5fd',
        }}>
          <Text style={{ color: '#7c3aed', fontSize: 13, fontWeight: 500 }}>
            ✦ Thanh toán kết hợp {selectedMethods.length} phương thức
          </Text>
        </div>
      )}
    </div>
  )
}
