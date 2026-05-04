import { useState, useEffect } from 'react'
import { Card, Form, Input, InputNumber, Select, Button, Steps, Typography, Tag, Space, Alert, message } from 'antd'
import { ThunderboltOutlined, LinkOutlined, CheckCircleOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Text } = Typography

// Generate unique order code mỗi lần
const genOrderCode = () => `ORDER-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`

export default function TestPaymentPage() {
  const [form] = Form.useForm()
  const [loading, setLoading]           = useState(false)
  const [result, setResult]             = useState<any>(null)
  const [currentStep, setCurrentStep]   = useState(0)
  const [tenantOptions, setTenantOptions] = useState<{value: string, label: string}[]>([])
  const [tenantLoading, setTenantLoading] = useState(false)
  const [merchantOptions, setMerchantOptions] = useState<{value: string, label: string, redirectUrl: string}[]>([])
  const [merchantLoading, setMerchantLoading] = useState(false)

  useEffect(() => {
    loadTenants()
    // Set unique order code khi mount
    form.setFieldValue('orderCode', genOrderCode())
  }, [])

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
    form.setFieldValue('merchantCode', undefined)
    setMerchantOptions([])
    if (!tenantId) return
    setMerchantLoading(true)
    try {
      const res = await axios.get(`/api/payment-tenants/${tenantId}/merchants`)
      setMerchantOptions(
        (res.data?.value ?? res.data ?? []).map((m: any) => ({
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
        orderCode: values.orderCode,   // luôn có — đã auto-gen
        amount: values.amount,
        currency: 'VND',
        customerInfo: {
          name: values.customerName || 'Demo Customer',
          phone: values.customerPhone || '0901234567',
        },
      }
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

  const handleReset = () => {
    setResult(null)
    setCurrentStep(0)
    form.setFieldValue('orderCode', genOrderCode())  // gen code mới
  }

  const selectedMerchant = merchantOptions.find(m => m.value === form.getFieldValue('merchantCode'))

  return (
    <div>
      <Steps
        current={currentStep}
        style={{ marginBottom: 24, background: '#fff', padding: '16px 24px', borderRadius: 8 }}
        items={[
          { title: 'Tạo Payment', description: 'Điền thông tin đơn hàng' },
          { title: 'Lấy Link', description: 'Copy payment URL' },
          { title: 'Test', description: 'Mở trang thanh toán' },
        ]}
      />

      <Card title={<><ThunderboltOutlined /> Tạo Test Payment</>} style={{ marginBottom: 24 }}
        extra={result && <Button icon={<ReloadOutlined />} onClick={handleReset}>Tạo mới</Button>}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ maxWidth: 560 }}
          initialValues={{ amount: 150000, customerName: 'Nguyen Van A', customerPhone: '0901234567' }}>

          <Form.Item label="Tenant" name="tenantId" rules={[{ required: true }]}>
            <Select options={tenantOptions} loading={tenantLoading} onChange={handleTenantChange} placeholder="Chọn tenant" />
          </Form.Item>

          <Form.Item
            label="Merchant (web/app)"
            name="merchantCode"
            extra={
              selectedMerchant
                ? <Text type="secondary" style={{ fontSize: 12 }}>↩ Redirect về: {selectedMerchant.redirectUrl}</Text>
                : merchantOptions.length === 0 && !merchantLoading
                  ? <Text type="warning" style={{ fontSize: 12 }}>Tenant chưa có merchant — dùng returnUrl mặc định</Text>
                  : null
            }
          >
            <Select options={merchantOptions} loading={merchantLoading} placeholder="Chọn merchant (tuỳ chọn)" allowClear />
          </Form.Item>

          <Form.Item
            label="Order Code"
            name="orderCode"
            rules={[{ required: true }]}
            extra="Tự động generate unique — có thể sửa"
          >
            <Input
              suffix={
                <ReloadOutlined
                  style={{ cursor: 'pointer', color: '#667eea' }}
                  onClick={() => form.setFieldValue('orderCode', genOrderCode())}
                />
              }
            />
          </Form.Item>

          <Form.Item label="Số tiền (VND)" name="amount" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              min={1000}
              step={10000}
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={v => Number(v!.replace(/,/g, ''))}
            />
          </Form.Item>

          <Space style={{ width: '100%' }} size={12}>
            <Form.Item label="Tên khách hàng" name="customerName" style={{ flex: 1, marginBottom: 0 }}>
              <Input />
            </Form.Item>
            <Form.Item label="Số điện thoại" name="customerPhone" style={{ flex: 1, marginBottom: 0 }}>
              <Input />
            </Form.Item>
          </Space>

          <Form.Item style={{ marginTop: 16 }}>
            <Button type="primary" htmlType="submit" loading={loading} icon={<ThunderboltOutlined />} size="large" disabled={!!result}>
              Generate Payment Link
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {result && (
        <Card title={<><CheckCircleOutlined style={{ color: '#52c41a' }} /> Payment Created</>}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Payment Code</Text>
                <div><Tag color="blue" style={{ fontSize: 13, padding: '3px 10px', marginTop: 4 }}>{result.paymentRequestCode}</Tag></div>
              </div>
            </div>

            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Payment URL</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <Text style={{ flex: 1, wordBreak: 'break-all', fontSize: 13 }}>{result.paymentUrl}</Text>
                <Button size="small" icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(result.paymentUrl); message.success('Copied!') }}>Copy</Button>
              </div>
            </div>

            <Button
              type="primary"
              size="large"
              icon={<LinkOutlined />}
              onClick={() => { window.open(result.paymentUrl, '_blank'); setCurrentStep(2) }}
              block
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: 10, height: 48 }}
            >
              Mở trang thanh toán →
            </Button>

            {currentStep >= 2 && (
              <Alert message="Trang thanh toán đã mở! Thử chọn CASH + ZaloPay để test split payment." type="info" showIcon />
            )}
          </Space>
        </Card>
      )}
    </div>
  )
}
