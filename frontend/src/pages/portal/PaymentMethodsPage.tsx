import { useState, useEffect } from 'react'
import { Card, Form, Select, Button, Table, message, Tag, Space, Typography, Alert, Spin } from 'antd'
import { CreditCardOutlined, CheckCircleOutlined, InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Text } = Typography

const METHOD_TYPES = [
  { value: 'CASH',          label: 'Tiền mặt',              icon: '💵', description: 'Xác nhận ngay, không cần cổng',          providers: ['(Nội bộ)'],          color: 'green'  },
  { value: 'E_WALLET',      label: 'Ví điện tử',            icon: '📱', description: 'ZaloPay, MoMo — cần cấu hình Provider',  providers: ['ZaloPay', 'MoMo'],   color: 'blue'   },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản',          icon: '🏦', description: 'VNPay, VietQR — cần cấu hình Provider',  providers: ['VNPay', 'Napas'],    color: 'purple' },
  { value: 'CARD',          label: 'Thẻ ATM / Visa',        icon: '💳', description: 'Thẻ nội địa/quốc tế — cần Provider',     providers: ['VNPay', 'OnePay'],   color: 'orange' },
]

export default function PaymentMethodsPage() {
  const [form] = Form.useForm()
  const [loading, setLoading]           = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  // Tenant → Merchant cascade
  const [tenantOptions, setTenantOptions]   = useState<{value: string, label: string}[]>([])
  const [tenantLoading, setTenantLoading]   = useState(false)
  const [merchantOptions, setMerchantOptions] = useState<{value: string, label: string}[]>([])
  const [merchantLoading, setMerchantLoading] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<string>('')

  // Danh sách PTTT đã đăng ký — fetch từ API
  const [registered, setRegistered]     = useState<any[]>([])
  const [tableLoading, setTableLoading] = useState(false)

  useEffect(() => { loadTenants() }, [])

  const loadTenants = async () => {
    setTenantLoading(true)
    try {
      const res = await axios.get('/api/payment-tenants')
      setTenantOptions((res.data?.value ?? res.data ?? []).map((t: any) => ({ value: t.tenantId, label: t.tenantName || t.tenantId })))
    } catch {
      message.error('Không thể tải danh sách tenant')
    } finally {
      setTenantLoading(false)
    }
  }

  const handleTenantChange = async (tenantId: string) => {
    setSelectedTenant(tenantId)
    form.setFieldValue('merchantCode', undefined)
    setMerchantOptions([])
    setRegistered([])
    if (!tenantId) return

    // Load merchants của tenant
    setMerchantLoading(true)
    try {
      const res = await axios.get(`/api/payment-tenants/${tenantId}/merchants`)
      setMerchantOptions((res.data?.value ?? res.data ?? []).map((m: any) => ({ value: m.merchantCode, label: `${m.merchantName} (${m.merchantCode})` })))
    } catch {} finally { setMerchantLoading(false) }
  }

  const handleMerchantChange = async (tenantId: string, merchantCode: string) => {
    if (!tenantId || !merchantCode) return
    setTableLoading(true)
    try {
      // Dùng endpoint mới: GET /payment-tenants/{id}/merchants/{code}/payment-methods
      const res = await axios.get(`/api/payment-tenants/${tenantId}/merchants/${merchantCode}/payment-methods`)
      setRegistered((res.data?.value ?? res.data ?? []).map((m: any) => ({ ...m, tenantId, merchantCode })))
    } catch {} finally { setTableLoading(false) }
  }

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const methods = values.methodTypes.map((type: string) => {
        const opt = METHOD_TYPES.find(m => m.value === type)!
        return { methodId: type, methodName: opt.label, enabled: true }
      })
      await axios.post(`/api/payment-tenants/${values.tenantId}/payment-methods`, { methods })
      message.success(`${methods.length} PTTT đã đăng ký cho ${values.tenantId}!`)
      form.resetFields(['methodTypes'])
      setSelectedTypes([])
      // Reload danh sách
      await handleMerchantChange(values.tenantId, values.merchantCode)
    } catch (err: any) {
      message.error(err.response?.data?.error?.message ?? 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  const needsProvider = selectedTypes.some(t => t !== 'CASH')

  const columns = [
    {
      title: 'PTTT', dataIndex: 'methodId', key: 'methodId',
      render: (v: string, r: any) => {
        const opt = METHOD_TYPES.find(m => m.value === v)
        return (
          <Space>
            <span style={{ fontSize: 18 }}>{opt?.icon ?? '💳'}</span>
            <div>
              <Text strong>{r.methodName ?? opt?.label ?? v}</Text>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{opt?.providers.join(' · ')}</div>
            </div>
          </Space>
        )
      },
    },
    {
      title: 'Tenant', dataIndex: 'tenantId', key: 'tenantId',
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Trạng thái', dataIndex: 'enabled', key: 'enabled',
      render: (v: boolean) => <Tag color={v !== false ? 'green' : 'red'} icon={<CheckCircleOutlined />}>{v !== false ? 'Active' : 'Inactive'}</Tag>,
    },
  ]

  return (
    <div>
      <Alert
        message={<span><strong>PTTT</strong> (Phương thức thanh toán) là loại hình từ góc nhìn khách hàng. <strong>Provider</strong> là cổng cụ thể xử lý. Cấu hình Provider ở tab <strong>Providers</strong>.</span>}
        type="info" showIcon icon={<InfoCircleOutlined />} style={{ marginBottom: 20 }}
      />

      <Card title={<><CreditCardOutlined /> Đăng ký PTTT theo Merchant</>} style={{ marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ maxWidth: 620 }}>

          {/* Tenant */}
          <Form.Item label="Tenant" name="tenantId" rules={[{ required: true }]}>
            <Select placeholder="Chọn tenant" options={tenantOptions} loading={tenantLoading} onChange={handleTenantChange} />
          </Form.Item>

          {/* Merchant — cascade từ Tenant */}
          <Form.Item
            label="Merchant (web/app)"
            name="merchantCode"
            rules={[{ required: true, message: 'Chọn merchant' }]}
            extra="PTTT được đăng ký cho từng merchant (web/app) riêng biệt"
          >
            <Select
              placeholder={selectedTenant ? 'Chọn merchant' : 'Chọn tenant trước'}
              options={merchantOptions}
              loading={merchantLoading}
              disabled={!selectedTenant}
              onChange={(v) => handleMerchantChange(selectedTenant, v)}
            />
          </Form.Item>

          {/* PTTT */}
          <Form.Item label="Phương thức thanh toán" name="methodTypes" rules={[{ required: true, message: 'Chọn ít nhất 1' }]}>
            <Select mode="multiple" placeholder="Chọn PTTT" onChange={setSelectedTypes} optionLabelProp="label">
              {METHOD_TYPES.map(opt => (
                <Select.Option key={opt.value} value={opt.value} label={`${opt.icon} ${opt.label}`}>
                  <Space>
                    <span style={{ fontSize: 18 }}>{opt.icon}</span>
                    <div>
                      <Text strong>{opt.label}</Text>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{opt.description}</div>
                    </div>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {needsProvider && (
            <Alert message="Các PTTT đã chọn cần cấu hình Provider. Vào tab Providers để cấu hình ZaloPay/MoMo/VNPay." type="warning" showIcon style={{ marginBottom: 16 }} />
          )}
          {selectedTypes.length > 1 && (
            <Alert message={`Split payment: Khách có thể kết hợp ${selectedTypes.length} PTTT trong 1 giao dịch`} type="success" showIcon style={{ marginBottom: 16 }} />
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<CreditCardOutlined />} size="large">
              Đăng ký PTTT
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Danh sách PTTT đã đăng ký */}
      <Card
        title={`PTTT đã đăng ký (${registered.length})`}
        extra={selectedTenant && <Button icon={<ReloadOutlined />} size="small" onClick={() => handleMerchantChange(selectedTenant, form.getFieldValue('merchantCode'))}>Làm mới</Button>}
      >
        <Spin spinning={tableLoading}>
          <Table
            dataSource={registered}
            columns={columns}
            rowKey={r => `${r.tenantId}-${r.methodId}`}
            pagination={false}
            size="middle"
            locale={{ emptyText: 'Chọn tenant và merchant để xem PTTT đã đăng ký' }}
          />
        </Spin>
      </Card>
    </div>
  )
}
