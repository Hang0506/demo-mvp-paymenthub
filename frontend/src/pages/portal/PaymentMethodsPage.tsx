import { useState, useEffect } from 'react'
import { Card, Form, Select, Button, Table, message, Tag, Space, Typography, Alert, Tooltip } from 'antd'
import { CreditCardOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Text } = Typography

// PTTT = Loại hình thanh toán (từ góc nhìn khách hàng)
const METHOD_TYPES = [
  {
    value: 'CASH',
    label: 'Tiền mặt',
    icon: '💵',
    description: 'Khách trả tiền mặt tại quầy, xác nhận ngay',
    providers: ['(Nội bộ, không cần cổng)'],
    color: 'green',
  },
  {
    value: 'E_WALLET',
    label: 'Ví điện tử',
    icon: '📱',
    description: 'Thanh toán qua ví ZaloPay, MoMo — cần cấu hình Provider',
    providers: ['ZaloPay', 'MoMo'],
    color: 'blue',
  },
  {
    value: 'BANK_TRANSFER',
    label: 'Chuyển khoản ngân hàng',
    icon: '🏦',
    description: 'Chuyển khoản qua VNPay, VietQR — cần cấu hình Provider',
    providers: ['VNPay', 'Napas VietQR'],
    color: 'purple',
  },
  {
    value: 'CARD',
    label: 'Thẻ ATM / Visa / Master',
    icon: '💳',
    description: 'Quẹt thẻ nội địa hoặc quốc tế — cần cấu hình Provider',
    providers: ['VNPay', 'OnePay'],
    color: 'orange',
  },
]

interface MethodConfig {
  tenantId: string
  methodType: string
  displayName: string
  enabled: boolean
}

export default function PaymentMethodsPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState<MethodConfig[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
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

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      // Gọi API với đúng model: methodType thay vì methodId
      const methods = values.methodTypes.map((type: string) => {
        const opt = METHOD_TYPES.find(m => m.value === type)!
        return {
          methodId: type,          // backward compat với API hiện tại
          methodName: opt.label,   // display name
          enabled: true,
        }
      })

      await axios.post(`/api/payment-tenants/${values.tenantId}/payment-methods`, { methods })

      const newEntries: MethodConfig[] = methods.map((m: any) => ({
        tenantId: values.tenantId,
        methodType: m.methodId,
        displayName: m.methodName,
        enabled: true,
      }))
      setRegistered(prev => [
        ...newEntries,
        ...prev.filter(r => r.tenantId !== values.tenantId),
      ])
      message.success(`${methods.length} phương thức thanh toán đã đăng ký cho ${values.tenantId}!`)
      form.resetFields()
      setSelectedTypes([])
    } catch (err: any) {
      message.error(err.response?.data?.error?.message ?? 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  const needsProvider = selectedTypes.some(t => t !== 'CASH')

  const columns = [
    {
      title: 'Tenant', dataIndex: 'tenantId', key: 'tenantId',
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Loại hình thanh toán (PTTT)', dataIndex: 'methodType', key: 'methodType',
      render: (v: string, r: MethodConfig) => {
        const opt = METHOD_TYPES.find(m => m.value === v)
        return (
          <Space>
            <span>{opt?.icon}</span>
            <div>
              <Text strong>{r.displayName}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>
                Provider: {opt?.providers.join(', ')}
              </Text>
            </div>
          </Space>
        )
      },
    },
    {
      title: 'Cổng thanh toán (Provider)', dataIndex: 'methodType', key: 'providers',
      render: (v: string) => {
        const opt = METHOD_TYPES.find(m => m.value === v)
        if (v === 'CASH') return <Tag color="green">Nội bộ</Tag>
        return (
          <Space>
            {opt?.providers.map(p => <Tag key={p} color="geekblue">{p}</Tag>)}
          </Space>
        )
      },
    },
    {
      title: 'Trạng thái', dataIndex: 'enabled', key: 'enabled',
      render: () => <Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>,
    },
  ]

  return (
    <div>
      <Alert
        message={
          <span>
            <strong>Phân biệt PTTT và Provider:</strong>
            {' '}PTTT là loại hình thanh toán (Tiền mặt, Ví điện tử...).
            Provider là cổng cụ thể (ZaloPay, MoMo...) xử lý từng loại.
            Cấu hình Provider ở tab <strong>Provider Config</strong>.
          </span>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 20 }}
      />

      <Card
        title={<><CreditCardOutlined /> Đăng ký Phương Thức Thanh Toán (PTTT)</>}
        style={{ marginBottom: 24 }}
        extra={<Text type="secondary">Chọn loại hình thanh toán tenant muốn hỗ trợ</Text>}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ maxWidth: 620 }}>
          <Form.Item label="Tenant" name="tenantId" rules={[{ required: true }]}>
            <Select placeholder="Chọn tenant" options={tenantOptions} loading={tenantLoading} />
          </Form.Item>

          <Form.Item
            label="Phương thức thanh toán"
            name="methodTypes"
            rules={[{ required: true, message: 'Chọn ít nhất 1 phương thức' }]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn loại hình thanh toán"
              onChange={setSelectedTypes}
              optionLabelProp="label"
            >
              {METHOD_TYPES.map(opt => (
                <Select.Option key={opt.value} value={opt.value} label={`${opt.icon} ${opt.label}`}>
                  <div style={{ padding: '4px 0' }}>
                    <Space>
                      <span style={{ fontSize: 18 }}>{opt.icon}</span>
                      <div>
                        <Text strong>{opt.label}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>{opt.description}</Text>
                        <br />
                        <Text style={{ fontSize: 11, color: '#1890ff' }}>
                          Provider: {opt.providers.join(', ')}
                        </Text>
                      </div>
                    </Space>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {needsProvider && (
            <Alert
              message={
                <span>
                  Các phương thức đã chọn cần cấu hình Provider.
                  Sau khi đăng ký, vào <strong>Provider Config</strong> để cấu hình ZaloPay/MoMo/VNPay.
                </span>
              }
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {selectedTypes.length > 1 && (
            <Alert
              message={`Split payment: Khách có thể kết hợp ${selectedTypes.length} phương thức trong 1 giao dịch`}
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<CreditCardOutlined />} size="large">
              Đăng ký PTTT
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {registered.length > 0 && (
        <Card title={`PTTT đã đăng ký (${registered.length})`}>
          <Table
            dataSource={registered}
            columns={columns}
            rowKey={r => `${r.tenantId}-${r.methodType}`}
            pagination={false}
            size="middle"
          />
        </Card>
      )}
    </div>
  )
}