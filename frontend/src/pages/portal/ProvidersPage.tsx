import { useState, useEffect } from 'react'
import { Card, Form, Input, Select, Button, Table, message, Tag, Typography, Alert, Tooltip, Space } from 'antd'
import { SettingOutlined, CheckCircleOutlined, LockOutlined, InfoCircleOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Text } = Typography

// Provider = cổng thanh toán cụ thể
const PROVIDERS = [
  {
    value: 'ZALOPAY',
    label: 'ZaloPay',
    icon: '💙',
    color: '#0068ff',
    methodType: 'E_WALLET',
    methodLabel: 'Ví điện tử',
    fields: ['merchantId', 'apiKey', 'secretKey'],
  },
  {
    value: 'MOMO',
    label: 'MoMo',
    icon: '💖',
    color: '#ae2070',
    methodType: 'E_WALLET',
    methodLabel: 'Ví điện tử',
    fields: ['merchantId', 'apiKey', 'secretKey'],
  },
  {
    value: 'VNPAY',
    label: 'VNPay',
    icon: '🏦',
    color: '#e31837',
    methodType: 'BANK_TRANSFER',
    methodLabel: 'Chuyển khoản / Thẻ ATM',
    fields: ['merchantId', 'apiKey', 'secretKey'],
  },
  {
    value: 'NAPAS',
    label: 'Napas VietQR',
    icon: '📲',
    color: '#00a651',
    methodType: 'BANK_TRANSFER',
    methodLabel: 'Chuyển khoản QR',
    fields: ['merchantId', 'apiKey', 'secretKey'],
  },
]

interface ProviderConfig {
  tenantId: string
  providerId: string
  merchantId: string
  methodType: string
  methodLabel: string
}

export default function ProvidersPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [configs, setConfigs] = useState<ProviderConfig[]>([])
  const [selectedProvider, setSelectedProvider] = useState('')
  const [tenantOptions, setTenantOptions] = useState<{value: string, label: string}[]>([])
  const [tenantLoading, setTenantLoading] = useState(false)

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

  useEffect(() => { loadTenants() }, [])

  const provider = PROVIDERS.find(p => p.value === selectedProvider)

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      await axios.post(`/api/payment-tenants/${values.tenantId}/providers/${values.providerId}`, {
        enabled: true,
        merchantId: values.merchantId,
        apiKey: values.apiKey,
        secretKey: values.secretKey,
        callbackUrl: `http://localhost:5000/api/payments/zalopay/callback`,
        returnUrl: 'http://localhost:3000',
      })

      const p = PROVIDERS.find(x => x.value === values.providerId)!
      setConfigs(prev => [
        {
          tenantId: values.tenantId,
          providerId: values.providerId,
          merchantId: values.merchantId,
          methodType: p.methodType,
          methodLabel: p.methodLabel,
        },
        ...prev,
      ])
      message.success(`${values.providerId} đã cấu hình cho ${values.tenantId}! Keys lưu dưới dạng KMS reference.`)
      form.resetFields()
      setSelectedProvider('')
    } catch (err: any) {
      message.error(err.response?.data?.error?.message ?? 'Cấu hình thất bại')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Tenant', dataIndex: 'tenantId', key: 'tenantId',
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'PTTT (Loại hình)', dataIndex: 'methodType', key: 'methodType',
      render: (_: string, r: ProviderConfig) => <Tag color="purple">{r.methodLabel}</Tag>,
    },
    {
      title: 'Provider (Cổng)', dataIndex: 'providerId', key: 'providerId',
      render: (v: string) => {
        const p = PROVIDERS.find(o => o.value === v)
        return <Tag color={p?.color ?? 'default'} style={{ color: '#fff' }}>{p?.icon} {v}</Tag>
      },
    },
    {
      title: 'Merchant ID', dataIndex: 'merchantId', key: 'merchantId',
      render: (v: string) => <Text code>{v}</Text>,
    },
    {
      title: 'API Key', key: 'apiKey',
      render: () => (
        <Tooltip title="Lưu dưới dạng KMS reference — không bao giờ lộ key thật">
          <Tag icon={<LockOutlined />} color="purple">kms://provider/api_key</Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Trạng thái', key: 'status',
      render: () => <Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>,
    },
  ]

  return (
    <div>
      <Alert
        message={
          <span>
            <strong>Provider</strong> là cổng thanh toán cụ thể (ZaloPay, MoMo, VNPay...) xử lý từng loại PTTT.
            Mỗi PTTT có thể có nhiều Provider. Ví dụ: <em>Ví điện tử</em> → ZaloPay hoặc MoMo.
          </span>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 20 }}
      />

      <Card
        title={<><SettingOutlined /> Cấu hình Provider (Cổng thanh toán)</>}
        style={{ marginBottom: 24 }}
        extra={<Text type="secondary">API key lưu dưới dạng KMS reference — không lưu plaintext</Text>}
      >
        <Alert
          message="Bảo mật: API key được lưu dưới dạng KMS reference (vd: kms://ZALOPAY/api_key). Key thật không bao giờ lưu vào database."
          type="warning"
          showIcon
          icon={<LockOutlined />}
          style={{ marginBottom: 20 }}
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ maxWidth: 600 }}>
          <Form.Item label="Tenant" name="tenantId" rules={[{ required: true }]}>
            <Select placeholder="Chọn tenant" options={tenantOptions} loading={tenantLoading} />
          </Form.Item>

          <Form.Item label="Provider (Cổng thanh toán)" name="providerId" rules={[{ required: true }]}>
            <Select
              placeholder="Chọn provider"
              onChange={setSelectedProvider}
            >
              {PROVIDERS.map(p => (
                <Select.Option key={p.value} value={p.value}>
                  <Space>
                    <span>{p.icon}</span>
                    <div>
                      <Text strong>{p.label}</Text>
                      <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                        → PTTT: {p.methodLabel}
                      </Text>
                    </div>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {provider && (
            <Alert
              message={`${provider.label} xử lý PTTT: "${provider.methodLabel}"`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item label="Merchant ID" name="merchantId" rules={[{ required: true }]}>
            <Input placeholder={provider ? `vd: ${provider.value.toLowerCase()}_merchant_001` : 'Merchant ID từ dashboard provider'} />
          </Form.Item>

          <Form.Item
            label={<span><LockOutlined /> API Key <Tag color="orange" style={{ marginLeft: 4 }}>Encrypted</Tag></span>}
            name="apiKey"
            rules={[{ required: true }]}
          >
            <Input.Password placeholder="Dán API key từ dashboard provider" />
          </Form.Item>

          <Form.Item
            label={<span><LockOutlined /> Secret Key <Tag color="orange" style={{ marginLeft: 4 }}>Encrypted</Tag></span>}
            name="secretKey"
            rules={[{ required: true }]}
          >
            <Input.Password placeholder="Dán secret key từ dashboard provider" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SettingOutlined />} size="large">
              Lưu cấu hình Provider
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {configs.length > 0 && (
        <Card title={`Provider đã cấu hình (${configs.length})`}>
          <Table
            dataSource={configs}
            columns={columns}
            rowKey={r => `${r.tenantId}-${r.providerId}`}
            pagination={false}
            size="middle"
          />
        </Card>
      )}
    </div>
  )
}