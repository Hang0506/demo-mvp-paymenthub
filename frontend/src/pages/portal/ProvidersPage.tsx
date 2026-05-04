import { useState, useEffect } from 'react'
import { Card, Form, Input, Select, Button, Table, message, Tag, Typography, Alert, Tooltip, Space, Spin } from 'antd'
import { SettingOutlined, CheckCircleOutlined, LockOutlined, InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Text } = Typography

const PROVIDERS = [
  { value: 'ZALOPAY', label: 'ZaloPay',      icon: '💙', color: '#0068ff', methodLabel: 'Ví điện tử' },
  { value: 'MOMO',    label: 'MoMo',         icon: '💖', color: '#ae2070', methodLabel: 'Ví điện tử' },
  { value: 'VNPAY',   label: 'VNPay',        icon: '🏦', color: '#e31837', methodLabel: 'Chuyển khoản / Thẻ ATM' },
  { value: 'NAPAS',   label: 'Napas VietQR', icon: '📲', color: '#00a651', methodLabel: 'Chuyển khoản QR' },
]

export default function ProvidersPage() {
  const [form] = Form.useForm()
  const [loading, setLoading]             = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('')

  // Tenant options
  const [tenantOptions, setTenantOptions] = useState<{value: string, label: string}[]>([])
  const [tenantLoading, setTenantLoading] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState('')

  // Danh sách providers đã config — fetch từ API, không mất khi reload
  const [configs, setConfigs]             = useState<any[]>([])
  const [tableLoading, setTableLoading]   = useState(false)

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

  const loadProviders = async (tenantId: string) => {
    if (!tenantId) return
    setTableLoading(true)
    try {
      const res = await axios.get(`/api/payment-tenants/${tenantId}/providers`)
      setConfigs((res.data?.value ?? res.data ?? []).map((p: any) => ({ ...p, tenantId })))
    } catch {
      message.error('Không thể tải danh sách provider')
    } finally {
      setTableLoading(false)
    }
  }

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenant(tenantId)
    setConfigs([])
    loadProviders(tenantId)
  }

  const provider = PROVIDERS.find(p => p.value === selectedProvider)

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      await axios.post(`/api/payment-tenants/${values.tenantId}/providers/${values.providerId}`, {
        enabled: true,
        merchantId: values.merchantId,
        apiKey: values.apiKey,
        secretKey: values.secretKey,
      })
      message.success(`${values.providerId} đã cấu hình! Keys lưu dưới dạng KMS reference.`)
      form.resetFields(['providerId', 'merchantId', 'apiKey', 'secretKey'])
      setSelectedProvider('')
      // Reload danh sách từ API
      await loadProviders(values.tenantId)
    } catch (err: any) {
      message.error(err.response?.data?.error?.message ?? 'Cấu hình thất bại')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Provider', dataIndex: 'providerId', key: 'providerId',
      render: (v: string) => {
        const p = PROVIDERS.find(o => o.value === v)
        return (
          <Space>
            <span style={{ fontSize: 18 }}>{p?.icon ?? '💳'}</span>
            <div>
              <Text strong>{p?.label ?? v}</Text>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{p?.methodLabel}</div>
            </div>
          </Space>
        )
      },
    },
    {
      title: 'Merchant ID', dataIndex: 'merchantId', key: 'merchantId',
      render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'API Key Ref', dataIndex: 'apiKeyRef', key: 'apiKeyRef',
      render: (v: string) => (
        <Tooltip title="Lưu dưới dạng KMS reference — key thật không bao giờ lộ">
          <Tag icon={<LockOutlined />} color="purple" style={{ fontSize: 11 }}>{v || 'kms://provider/api_key'}</Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Trạng thái', dataIndex: 'enabled', key: 'enabled',
      render: (v: boolean) => <Tag color={v !== false ? 'green' : 'red'} icon={<CheckCircleOutlined />}>{v !== false ? 'Active' : 'Inactive'}</Tag>,
    },
  ]

  return (
    <div>
      <Alert
        message={<span><strong>Provider</strong> là cổng thanh toán cụ thể (ZaloPay, MoMo...). API key được mã hóa AES-256 trước khi lưu DB — không bao giờ lưu plaintext.</span>}
        type="info" showIcon icon={<InfoCircleOutlined />} style={{ marginBottom: 20 }}
      />

      <Card
        title={<><SettingOutlined /> Cấu hình Provider</>}
        style={{ marginBottom: 24 }}
        extra={<Text type="secondary"><LockOutlined /> Keys encrypted</Text>}
      >
        <Alert
          message="API key được mã hóa AES-256 → lưu vào DB dưới dạng ciphertext. Chỉ Payment Hub mới decrypt được khi cần gọi provider."
          type="warning" showIcon icon={<LockOutlined />} style={{ marginBottom: 20 }}
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ maxWidth: 600 }}>
          <Form.Item label="Tenant" name="tenantId" rules={[{ required: true }]}>
            <Select placeholder="Chọn tenant" options={tenantOptions} loading={tenantLoading} onChange={handleTenantChange} />
          </Form.Item>

          <Form.Item label="Provider" name="providerId" rules={[{ required: true }]}>
            <Select placeholder="Chọn provider" onChange={setSelectedProvider}>
              {PROVIDERS.map(p => (
                <Select.Option key={p.value} value={p.value}>
                  <Space>
                    <span>{p.icon}</span>
                    <Text strong>{p.label}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>→ {p.methodLabel}</Text>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {provider && (
            <Alert message={`${provider.label} xử lý: "${provider.methodLabel}"`} type="info" showIcon style={{ marginBottom: 16 }} />
          )}

          <Form.Item label="Merchant ID (do provider cấp)" name="merchantId" rules={[{ required: true }]}>
            <Input placeholder="vd: 2553 (ZaloPay AppId)" />
          </Form.Item>

          <Space style={{ width: '100%' }} size={12}>
            <Form.Item
              label={<span><LockOutlined /> API Key <Tag color="orange" style={{ fontSize: 10 }}>Encrypted</Tag></span>}
              name="apiKey" rules={[{ required: true }]} style={{ flex: 1, marginBottom: 0 }}
            >
              <Input.Password placeholder="API key từ dashboard provider" />
            </Form.Item>
            <Form.Item
              label={<span><LockOutlined /> Secret Key <Tag color="orange" style={{ fontSize: 10 }}>Encrypted</Tag></span>}
              name="secretKey" rules={[{ required: true }]} style={{ flex: 1, marginBottom: 0 }}
            >
              <Input.Password placeholder="Secret key từ dashboard provider" />
            </Form.Item>
          </Space>

          <Form.Item style={{ marginTop: 16 }}>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SettingOutlined />} size="large">
              Lưu cấu hình Provider
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Danh sách providers — fetch từ API, không mất khi reload */}
      <Card
        title={`Providers đã cấu hình${selectedTenant ? ` — ${selectedTenant}` : ''} (${configs.length})`}
        extra={selectedTenant && <Button icon={<ReloadOutlined />} size="small" onClick={() => loadProviders(selectedTenant)}>Làm mới</Button>}
      >
        <Spin spinning={tableLoading}>
          <Table
            dataSource={configs}
            columns={columns}
            rowKey={r => `${r.tenantId}-${r.providerId}`}
            pagination={false}
            size="middle"
            locale={{ emptyText: 'Chọn tenant để xem providers đã cấu hình' }}
          />
        </Spin>
      </Card>
    </div>
  )
}
