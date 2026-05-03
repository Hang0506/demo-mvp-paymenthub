import { useState, useEffect } from 'react'
import { Card, Form, Input, InputNumber, Select, Button, Steps, Typography, Tag, Space, Alert, Divider, message } from 'antd'
import { ThunderboltOutlined, LinkOutlined, CheckCircleOutlined, CopyOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Text, Title } = Typography

export default function TestPaymentPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [tenantOptions, setTenantOptions] = useState<{value: string, label: string}[]>([])
  const [tenantLoading, setTenantLoading] = useState(false)
  const [merchantOptions, setMerchantOptions] = useState<{value: string, label: string, redirectUrl: string}[]>([])
  const [merchantLoading, setMerchantLoading] = useState(false)

  useEffect(() => { loadTenants() }, [])

  const loadTenants = async () => {
    setTenantLoading(true)
    try {
      const res = await axios.get('/api/payment-tenants')
      setTenantOptions(res.data.map((t: any) => ({ value: t.tenantId, label: t.tenantName || t.tenantId })))
    } catch {
      message.error('Không thể tải danh sách tenant')
    } finally {
      setTenantLoading(false)
    }
  }

  const handleTenantChange = async (tenantId: string) => {
    // Reset merchant selection khi đổi tenant
    form.setFieldValue('merchantCode', undefined)
    setMerchantOptions([])
    if (!tenantId) return

    setMerchantLoading(true)
    try {
      const res = await axios.get(`/api/payment-tenants/${tenantId}/merchants`)
      setMerchantOptions(
        res.data.map((m: any) => ({
          value: m.merchantCode,
          label: `${m.merchantName} (${m.merchantCode})`,
          redirectUrl: m.redirectUrl,
        }))
      )
    } catch {
      message.error('Không thể tải danh sách merchant')
    } finally {
      setMerchantLoading(false)
    }
  }

  const handleCreate = async (values: any) => {
    setLoading(true)
    try {
      const payload: any = {
        tenantId: values.tenantId,
        orderCode: values.orderCode || `ORDER-${Date.now()}`,
        amount: values.amount,
        currency: 'VND',
        customerInfo: {
          name: values.customerName || 'Demo Customer',
          phone: values.customerPhone || '0901234567',
        },
      }

      // Ưu tiên merchantCode nếu có, fallback returnUrl
      if (values.merchantCode) {
        payload.merchantCode = values.merchantCode
      } else {
        payload.returnUrl = 'http://localhost:3000/payment/result'
      }

      const res = await axios.post('/api/payments', payload)
      setResult(res.data)
      setCurrentStep(1)
      message.success('Payment link created!')
    } catch (err: any) {
      message.error(err.response?.data?.error?.message ?? 'Failed to create payment')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    message.success('Copied!')
  }

  const openPaymentPage = () => {
    if (result?.paymentUrl) {
      window.open(result.paymentUrl, '_blank')
      setCurrentStep(2)
    }
  }

  // Lấy redirectUrl của merchant đang chọn để hiển thị preview
  const selectedMerchant = merchantOptions.find(m => m.value === form.getFieldValue('merchantCode'))

  return (
    <div>
      <Steps
        current={currentStep}
        style={{ marginBottom: 24, background: '#fff', padding: '16px 24px', borderRadius: 8 }}
        items={[
          { title: 'Create Payment', description: 'Fill order details' },
          { title: 'Get Link', description: 'Copy payment URL' },
          { title: 'Test Page', description: 'Open payment page' },
        ]}
      />

      <Card title={<><ThunderboltOutlined /> Create Test Payment</>} style={{ marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ maxWidth: 560 }}
          initialValues={{ amount: 150000, customerName: 'Nguyen Van A', customerPhone: '0901234567' }}>

          <Form.Item label="Tenant" name="tenantId" rules={[{ required: true }]}>
            <Select options={tenantOptions} loading={tenantLoading} onChange={handleTenantChange} />
          </Form.Item>

          <Form.Item
            label="Merchant (web/app)"
            name="merchantCode"
            extra={
              selectedMerchant
                ? <Text type="secondary" style={{ fontSize: 12 }}>Redirect về: {selectedMerchant.redirectUrl}</Text>
                : merchantOptions.length === 0 && !merchantLoading
                  ? <Text type="warning" style={{ fontSize: 12 }}>Tenant chưa có merchant — sẽ dùng returnUrl mặc định</Text>
                  : null
            }
          >
            <Select
              options={merchantOptions}
              loading={merchantLoading}
              placeholder="Chọn merchant (tuỳ chọn)"
              allowClear
            />
          </Form.Item>

          <Form.Item label="Order Code" name="orderCode">
            <Input placeholder="Auto-generated if empty" />
          </Form.Item>

          <Form.Item label="Amount (VND)" name="amount" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={1000}
              step={10000}
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={v => Number(v!.replace(/,/g, ''))}
            />
          </Form.Item>

          <Form.Item label="Customer Name" name="customerName">
            <Input />
          </Form.Item>

          <Form.Item label="Customer Phone" name="customerPhone">
            <Input />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<ThunderboltOutlined />} size="large">
              Generate Payment Link
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {result && (
        <Card title={<><CheckCircleOutlined style={{ color: '#52c41a' }} /> Payment Created</>}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Text type="secondary">Payment Code</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>{result.paymentRequestCode}</Tag>
              </div>
            </div>

            <div>
              <Text type="secondary">Payment URL</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, background: '#f5f5f5', padding: '8px 12px', borderRadius: 6 }}>
                <Text code style={{ flex: 1, wordBreak: 'break-all' }}>{result.paymentUrl}</Text>
                <Button size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(result.paymentUrl)}>Copy</Button>
              </div>
            </div>

            <Alert
              message="Payment page is ready. Click below to open it and test the split payment flow."
              type="success"
              showIcon
            />

            <Button
              type="primary"
              size="large"
              icon={<LinkOutlined />}
              onClick={openPaymentPage}
              block
            >
              Open Payment Page →
            </Button>

            {currentStep >= 2 && (
              <Alert
                message="Payment page opened! Try selecting CASH + ZaloPay for split payment demo."
                type="info"
                showIcon
              />
            )}
          </Space>
        </Card>
      )}
    </div>
  )
}