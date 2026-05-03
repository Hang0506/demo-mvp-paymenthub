import { useState } from 'react'
import { Card, Checkbox, Radio, Typography, Space } from 'antd'
import type { PaymentMethod, PaymentSplit } from '../types'

const { Text } = Typography

const METHOD_DISPLAY: Record<string, { icon: string; label: string; color: string }> = {
  CASH:          { icon: '💵', label: 'Tiền mặt',           color: '#52c41a' },
  E_WALLET:      { icon: '📱', label: 'Ví điện tử',         color: '#1890ff' },
  BANK_TRANSFER: { icon: '🏦', label: 'Chuyển khoản',       color: '#722ed1' },
  CARD:          { icon: '💳', label: 'Thẻ ATM / Visa',     color: '#fa8c16' },
  ZALOPAY:       { icon: '💙', label: 'ZaloPay',            color: '#0068ff' },
  MOMO:          { icon: '💖', label: 'MoMo',               color: '#ae2070' },
  VNPAY:         { icon: '🏦', label: 'VNPay',              color: '#e31837' },
  NAPAS:         { icon: '📲', label: 'Napas VietQR',       color: '#00a651' },
  ONEPAY:        { icon: '💳', label: 'OnePay',             color: '#f5a623' },
}

interface PaymentMethodSelectorProps {
  methods: PaymentMethod[]
  selectedMethods: PaymentMethod[]
  onMethodSelect: (methods: PaymentMethod[], splits: PaymentSplit[], totalAmount: number) => void
  totalAmount: number
}

export default function PaymentMethodSelector({
  methods,
  selectedMethods,
  onMethodSelect,
  totalAmount,
}: PaymentMethodSelectorProps) {
  // Track selected provider per PTTT: { E_WALLET: 'ZALOPAY' }
  const [selectedProviders, setSelectedProviders] = useState<Record<string, string>>({})

  const isMethodChecked = (methodId: string) =>
    selectedMethods.some(m => m.methodId === methodId)

  const handleMethodToggle = (method: PaymentMethod, checked: boolean) => {
    let newSelected: PaymentMethod[]

    if (checked) {
      // Nếu PTTT có providers → auto-select provider đầu tiên
      if (method.providers.length > 0 && !selectedProviders[method.methodId]) {
        setSelectedProviders(prev => ({
          ...prev,
          [method.methodId]: method.providers[0].providerId,
        }))
      }
      newSelected = [...selectedMethods, method]
    } else {
      newSelected = selectedMethods.filter(m => m.methodId !== method.methodId)
    }

    rebuildSplits(newSelected, selectedProviders)
    onMethodSelect(newSelected, buildSplits(newSelected, selectedProviders, totalAmount), totalAmount)
  }

  const handleProviderSelect = (method: PaymentMethod, providerId: string) => {
    const newProviders = { ...selectedProviders, [method.methodId]: providerId }
    setSelectedProviders(newProviders)
    onMethodSelect(selectedMethods, buildSplits(selectedMethods, newProviders, totalAmount), totalAmount)
  }

  const buildSplits = (
    methods: PaymentMethod[],
    providers: Record<string, string>,
    total: number
  ): PaymentSplit[] => {
    if (methods.length === 0) return []
    const perMethod = Math.floor(total / methods.length)
    const remainder = total % methods.length
    return methods.map((m, i) => ({
      // Nếu PTTT có provider đã chọn → dùng providerId, không thì dùng methodId
      methodId: m.providers.length > 0
        ? (providers[m.methodId] ?? m.providers[0].providerId)
        : m.methodId,
      amount: perMethod + (i === 0 ? remainder : 0),
    }))
  }

  const rebuildSplits = (methods: PaymentMethod[], providers: Record<string, string>) => {
    return buildSplits(methods, providers, totalAmount)
  }

  return (
    <div>
      <Text strong style={{ fontSize: 16, marginBottom: 16, display: 'block' }}>
        Chọn phương thức thanh toán:
      </Text>

      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {methods.map(method => {
          const display = METHOD_DISPLAY[method.methodId] ?? {
            icon: '💳', label: method.methodName, color: '#1890ff',
          }
          const checked = isMethodChecked(method.methodId)
          const hasProviders = method.providers.length > 0
          const chosenProvider = selectedProviders[method.methodId] ?? method.providers[0]?.providerId

          return (
            <Card
              key={method.methodId}
              style={{
                borderColor: checked ? display.color : '#d9d9d9',
                background: checked ? '#f6ffed' : '#fff',
                cursor: 'pointer',
              }}
              bodyStyle={{ padding: '12px 16px' }}
            >
              {/* ── PTTT cha ── */}
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => handleMethodToggle(method, !checked)}
              >
                <Space size="middle">
                  <span style={{ fontSize: 26 }}>{display.icon}</span>
                  <div>
                    <Text strong style={{ fontSize: 15 }}>{display.label}</Text>
                    {hasProviders && (
                      <>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {method.providers.map(p => METHOD_DISPLAY[p.providerId]?.label ?? p.providerName).join(', ')}
                        </Text>
                      </>
                    )}
                  </div>
                </Space>
                <Checkbox
                  checked={checked}
                  onChange={e => handleMethodToggle(method, e.target.checked)}
                  onClick={e => e.stopPropagation()}
                />
              </div>

              {/* ── Provider con (chỉ hiện khi PTTT được chọn và có providers) ── */}
              {checked && hasProviders && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0', paddingLeft: 42 }}>
                  <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                    Chọn cổng thanh toán:
                  </Text>
                  <Radio.Group
                    value={chosenProvider}
                    onChange={e => handleProviderSelect(method, e.target.value)}
                  >
                    <Space direction="vertical" size="small">
                      {method.providers.map(p => {
                        const pd = METHOD_DISPLAY[p.providerId] ?? { icon: '💳', label: p.providerName, color: '#1890ff' }
                        return (
                          <Radio key={p.providerId} value={p.providerId}>
                            <Space>
                              <span>{pd.icon}</span>
                              <Text>{pd.label}</Text>
                            </Space>
                          </Radio>
                        )
                      })}
                    </Space>
                  </Radio.Group>
                </div>
              )}
            </Card>
          )
        })}
      </Space>

      {selectedMethods.length > 1 && (
        <div style={{ marginTop: 16, padding: '10px 14px', background: '#f6ffed', borderRadius: 6, border: '1px solid #b7eb8f' }}>
          <Text style={{ color: '#52c41a' }}>
            ✓ Thanh toán kết hợp {selectedMethods.length} phương thức — nhập số tiền cho từng phương thức bên dưới
          </Text>
        </div>
      )}
    </div>
  )
}
