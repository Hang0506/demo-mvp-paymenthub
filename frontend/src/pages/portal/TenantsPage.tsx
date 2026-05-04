import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Table, message, Tag, Typography, Modal, Select, Tabs, Popconfirm, Space } from 'antd'
import { PlusOutlined, CheckCircleOutlined, ReloadOutlined, ShopOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Text } = Typography

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface Tenant {
  tenantId: string
  tenantName: string
  webhookUrl: string
  enabled: boolean
  createdAt: string
  providerCount?: number
  merchantCount?: number
}

interface ProviderConfigDto {
  providerId: string
  merchantId: string
  apiKeyRef: string
  enabled: boolean
}

interface MerchantDto {
  id: string
  merchantCode: string
  merchantName: string
  redirectUrl: string
  enabled: boolean
  createdAt: string
}

const SUPPORTED_PROVIDERS = [
  { value: 'zalopay', label: 'ZaloPay' },
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function TenantsPage() {
  const [form] = Form.useForm()
  const [providerForm] = Form.useForm()
  const [merchantAppForm] = Form.useForm()

  const [loading, setLoading] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])

  // Modal state
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  // Provider config state
  const [providerConfigs, setProviderConfigs] = useState<ProviderConfigDto[]>([])
  const [providerSubmitting, setProviderSubmitting] = useState(false)

  // Merchant app state (web/app của tenant)
  const [merchantApps, setMerchantApps] = useState<MerchantDto[]>([])
  const [merchantAppSubmitting, setMerchantAppSubmitting] = useState(false)

  useEffect(() => { loadTenants() }, [])

  // ─── Load tenants ───────────────────────────────────────────────────────────

  const loadTenants = async () => {
    setTableLoading(true)
    try {
      const res = await axios.get('/api/payment-tenants')
      const tenantList: Tenant[] = res.data?.value ?? res.data ?? []
      const tenantsWithCount = await Promise.all(
        tenantList.map(async (tenant) => {
          try {
            const [provRes, merRes] = await Promise.all([
              axios.get(`/api/payment-tenants/${tenant.tenantId}/providers`),
              axios.get(`/api/payment-tenants/${tenant.tenantId}/merchants`),
            ])
            const provList = provRes.data?.value ?? provRes.data ?? []
            const merList  = merRes.data?.value  ?? merRes.data  ?? []
            return { ...tenant, providerCount: provList.length, merchantCount: merList.length }
          } catch {
            return { ...tenant, providerCount: 0, merchantCount: 0 }
          }
        })
      )
      setTenants(tenantsWithCount)
    } catch {
      message.error('Không thể tải danh sách tenant')
    } finally {
      setTableLoading(false)
    }
  }

  // ─── Register tenant ────────────────────────────────────────────────────────

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      await axios.post('/api/payment-tenants', {
        tenantId: values.tenantId,
        tenantName: values.tenantName,
        webhookUrl: values.webhookUrl,
      })
      message.success(`Tenant "${values.tenantName}" đã đăng ký thành công!`)
      form.resetFields()
      loadTenants()
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? err.response?.data?.message ?? 'Đăng ký thất bại'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // ─── Open modal ─────────────────────────────────────────────────────────────

  const handleOpenModal = async (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setModalVisible(true)
    setModalLoading(true)
    try {
      const [provRes, merRes] = await Promise.all([
        axios.get(`/api/payment-tenants/${tenant.tenantId}/providers`),
        axios.get(`/api/payment-tenants/${tenant.tenantId}/merchants`),
      ])
      setProviderConfigs(provRes.data?.value ?? provRes.data ?? [])
      setMerchantApps(merRes.data?.value ?? merRes.data ?? [])
    } catch {
      message.error('Không thể tải dữ liệu')
    } finally {
      setModalLoading(false)
    }
  }

  const handleCloseModal = () => {
    setModalVisible(false)
    setSelectedTenant(null)
    setProviderConfigs([])
    setMerchantApps([])
    providerForm.resetFields()
    merchantAppForm.resetFields()
  }

  // ─── Provider config ────────────────────────────────────────────────────────

  const handleProviderSubmit = async (values: any) => {
    if (!selectedTenant) return
    setProviderSubmitting(true)
    try {
      await axios.post(
        `/api/payment-tenants/${selectedTenant.tenantId}/providers/${values.provider}`,
        { merchantId: values.merchantId, enabled: true }
      )
      message.success('Cấu hình provider đã được thêm!')
      providerForm.resetFields()
      const res = await axios.get(`/api/payment-tenants/${selectedTenant.tenantId}/providers`)
      setProviderConfigs(res.data?.value ?? res.data ?? [])
      loadTenants()
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? 'Thêm provider thất bại'
      message.error(msg)
    } finally {
      setProviderSubmitting(false)
    }
  }

  // ─── Merchant app (web/app của tenant) ─────────────────────────────────────

  const handleMerchantAppSubmit = async (values: any) => {
    if (!selectedTenant) return
    setMerchantAppSubmitting(true)
    try {
      const res = await axios.post(
        `/api/payment-tenants/${selectedTenant.tenantId}/merchants`,
        {
          merchantCode: values.merchantCode,
          merchantName: values.merchantName,
          redirectUrl: values.redirectUrl,
        }
      )
      message.success(`Merchant "${values.merchantName}" đã được thêm!`)
      merchantAppForm.resetFields()
      setMerchantApps(prev => [...prev, res.data])
      loadTenants()
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? 'Thêm merchant thất bại'
      message.error(msg)
    } finally {
      setMerchantAppSubmitting(false)
    }
  }

  const handleDeleteMerchantApp = async (merchantId: string) => {
    if (!selectedTenant) return
    try {
      await axios.delete(`/api/payment-tenants/${selectedTenant.tenantId}/merchants/${merchantId}`)
      message.success('Đã xóa merchant')
      setMerchantApps(prev => prev.filter(m => m.id !== merchantId))
      loadTenants()
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? 'Xóa thất bại'
      message.error(msg)
    }
  }

  // ─── Table columns ──────────────────────────────────────────────────────────

  const columns = [
    {
      title: 'Tenant ID', dataIndex: 'tenantId', key: 'tenantId',
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Tên Tenant', dataIndex: 'tenantName', key: 'tenantName',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: 'Webhook URL', dataIndex: 'webhookUrl', key: 'webhookUrl',
      render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt',
      render: (v: string) => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
    },
    {
      title: 'Merchants',
      key: 'merchants',
      render: (_: any, record: Tenant) => {
        const count = record.merchantCount ?? 0
        return count > 0
          ? <Tag color="purple" icon={<ShopOutlined />}>{count} merchant</Tag>
          : <Tag color="default">Chưa có</Tag>
      },
    },
    {
      title: 'Providers',
      key: 'providers',
      render: (_: any, record: Tenant) => {
        const count = record.providerCount ?? 0
        return count > 0
          ? <Tag color="green">{count} provider</Tag>
          : <Tag color="default">Chưa có</Tag>
      },
    },
    {
      title: 'Trạng thái', dataIndex: 'enabled', key: 'enabled',
      render: () => <Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: Tenant) => (
        <Button size="small" icon={<ShopOutlined />} onClick={() => handleOpenModal(record)}>
          Quản lý
        </Button>
      ),
    },
  ]

  // ─── Merchant app table columns ─────────────────────────────────────────────

  const merchantAppColumns = [
    {
      title: 'Mã Merchant',
      dataIndex: 'merchantCode',
      key: 'merchantCode',
      render: (v: string) => <Tag color="blue"><code>{v}</code></Tag>,
    },
    {
      title: 'Tên',
      dataIndex: 'merchantName',
      key: 'merchantName',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: 'Redirect URL',
      dataIndex: 'redirectUrl',
      key: 'redirectUrl',
      render: (v: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          <LinkOutlined /> {v}
        </Text>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: any, record: MerchantDto) => (
        <Popconfirm
          title="Xóa merchant này?"
          onConfirm={() => handleDeleteMerchantApp(record.id)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ]

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Registration form */}
      <Card
        title={<><PlusOutlined /> Đăng ký Tenant mới</>}
        style={{ marginBottom: 24 }}
        extra={<Text type="secondary">Mỗi tenant là 1 đơn vị kinh doanh độc lập</Text>}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ maxWidth: 560 }}>
          <Form.Item
            label="Tenant ID"
            name="tenantId"
            rules={[
              { required: true, message: 'Bắt buộc' },
              { pattern: /^[a-z0-9-]+$/, message: 'Chỉ dùng chữ thường, số, dấu gạch ngang' },
            ]}
            extra="Ví dụ: nha-thuoc-lc, ict-oms, dental-clinic"
          >
            <Input placeholder="vd: nha-thuoc-lc" />
          </Form.Item>

          <Form.Item label="Tên hiển thị" name="tenantName" rules={[{ required: true }]}>
            <Input placeholder="vd: Nhà Thuốc Long Châu" />
          </Form.Item>

          <Form.Item
            label="Webhook URL"
            name="webhookUrl"
            rules={[{ required: true }, { type: 'url', message: 'Phải là URL hợp lệ' }]}
            extra="PaymentHub gọi URL này (server-to-server) để thông báo trạng thái thanh toán"
          >
            <Input placeholder="https://your-system.com/webhook/payment" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />} size="large">
              Đăng ký Tenant
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Tenant list */}
      <Card
        title={`Danh sách Tenant (${tenants.length})`}
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadTenants} loading={tableLoading}>
            Làm mới
          </Button>
        }
      >
        <Table
          dataSource={tenants}
          columns={columns}
          rowKey="tenantId"
          loading={tableLoading}
          pagination={false}
          size="middle"
          locale={{ emptyText: 'Chưa có tenant nào.' }}
        />
      </Card>

      {/* Management modal */}
      <Modal
        title={<><ShopOutlined /> Quản lý — {selectedTenant?.tenantName}</>}
        open={modalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={720}
      >
        <Tabs
          items={[
            {
              key: 'merchants',
              label: <><ShopOutlined /> Merchant (web/app)</>,
              children: (
                <>
                  {/* Merchant list */}
                  <Table
                    dataSource={merchantApps}
                    columns={merchantAppColumns}
                    rowKey="id"
                    loading={modalLoading}
                    pagination={false}
                    size="small"
                    style={{ marginBottom: 24 }}
                    locale={{ emptyText: 'Chưa có merchant nào.' }}
                  />

                  {/* Add merchant form */}
                  <Text strong style={{ display: 'block', marginBottom: 12 }}>Thêm Merchant mới</Text>
                  <Form form={merchantAppForm} layout="vertical" onFinish={handleMerchantAppSubmit}>
                    <Space.Compact style={{ width: '100%', marginBottom: 0 }}>
                      <Form.Item
                        name="merchantCode"
                        label="Mã Merchant"
                        style={{ flex: 1, marginRight: 8 }}
                        rules={[
                          { required: true, message: 'Bắt buộc' },
                          { pattern: /^[a-z0-9-_]+$/i, message: 'Chỉ dùng chữ, số, gạch ngang/dưới' },
                        ]}
                        extra="Tenant dùng mã này khi tạo payment"
                      >
                        <Input placeholder="vd: web-rsa, mobile-app" />
                      </Form.Item>
                      <Form.Item
                        name="merchantName"
                        label="Tên hiển thị"
                        style={{ flex: 1 }}
                        rules={[{ required: true, message: 'Bắt buộc' }]}
                      >
                        <Input placeholder="vd: Web RSA, App Mobile" />
                      </Form.Item>
                    </Space.Compact>
                    <Form.Item
                      name="redirectUrl"
                      label="Redirect URL"
                      rules={[
                        { required: true, message: 'Bắt buộc' },
                        { type: 'url', message: 'Phải là URL hợp lệ' },
                      ]}
                      extra="PaymentHub redirect người dùng về URL này sau khi thanh toán xong"
                    >
                      <Input placeholder="https://web-rsa.com/payment/result" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={merchantAppSubmitting} icon={<PlusOutlined />}>
                        Thêm Merchant
                      </Button>
                    </Form.Item>
                  </Form>
                </>
              ),
            },
            {
              key: 'providers',
              label: 'Provider Config',
              children: (
                <>
                  {/* Provider list */}
                  <Table
                    dataSource={providerConfigs}
                    rowKey="providerId"
                    loading={modalLoading}
                    pagination={false}
                    size="small"
                    style={{ marginBottom: 24 }}
                    locale={{ emptyText: 'Chưa có provider nào.' }}
                    columns={[
                      {
                        title: 'Provider',
                        dataIndex: 'providerId',
                        render: (v: string) => <Tag color="blue">{v}</Tag>,
                      },
                      { title: 'Merchant ID', dataIndex: 'merchantId' },
                      {
                        title: 'Trạng thái',
                        dataIndex: 'enabled',
                        render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag>,
                      },
                    ]}
                  />

                  {/* Add provider form */}
                  <Text strong style={{ display: 'block', marginBottom: 12 }}>Thêm Provider Config</Text>
                  <Form form={providerForm} layout="vertical" onFinish={handleProviderSubmit}>
                    <Form.Item
                      label="Payment Provider"
                      name="provider"
                      rules={[{ required: true, message: 'Vui lòng chọn provider' }]}
                    >
                      <Select options={SUPPORTED_PROVIDERS} placeholder="Chọn provider" />
                    </Form.Item>
                    <Form.Item
                      label="Merchant ID (tại provider)"
                      name="merchantId"
                      rules={[{ required: true, message: 'Bắt buộc' }]}
                      extra="Mã merchant do ZaloPay/VNPay cấp cho bạn"
                    >
                      <Input placeholder="vd: ZALOPAY_MERCHANT_001" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={providerSubmitting} icon={<PlusOutlined />}>
                        Thêm Provider
                      </Button>
                    </Form.Item>
                  </Form>
                </>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  )
}
