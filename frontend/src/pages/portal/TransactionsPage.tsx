import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Tag, Select, Button, Space, Typography,
  Descriptions, Modal, Progress, Statistic, Row, Col, Tooltip, Badge, Popconfirm, message
} from 'antd'
import {
  EyeOutlined, ReloadOutlined, CheckCircleOutlined,
  ClockCircleOutlined, CloseCircleOutlined, LinkOutlined,
  DollarOutlined, TransactionOutlined, SyncOutlined, RollbackOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import axios from 'axios'

const { Text, Link } = Typography

const STATUS_CFG = {
  PAID:           { color: 'success',    icon: <CheckCircleOutlined />, text: 'Đã thanh toán',   badge: 'success'    as const },
  PENDING:        { color: 'processing', icon: <SyncOutlined spin />,  text: 'Đang xử lý',       badge: 'processing' as const },
  FAILED:         { color: 'error',      icon: <CloseCircleOutlined />, text: 'Thất bại',         badge: 'error'      as const },
  PARTIAL_PAID:   { color: 'warning',    icon: <ExclamationCircleOutlined />, text: 'Thanh toán 1 phần', badge: 'warning' as const },
  REFUNDED:       { color: 'default',    icon: <RollbackOutlined />,   text: 'Đã hoàn tiền',     badge: 'default'    as const },
  PARTIAL_REFUND: { color: 'warning',    icon: <RollbackOutlined />,   text: 'Hoàn 1 phần',      badge: 'warning'    as const },
}

const SPLIT_STATUS_COLOR: Record<string, string> = {
  Captured:         'success',
  PendingAuthorize: 'processing',
  Failed:           'error',
  Created:          'default',
}

export default function TransactionsPage() {
  const [loading, setLoading]           = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [selectedTenant, setSelectedTenant] = useState<string>('')
  const [tenantOptions, setTenantOptions]   = useState<{value: string, label: string}[]>([])
  const [detailModal, setDetailModal]   = useState<any>(null)

  const loadTenants = async () => {
    try {
      const res = await axios.get('/api/payment-tenants')
      setTenantOptions([
        { value: '', label: 'Tất cả tenants' },
        ...res.data.map((t: any) => ({ value: t.tenantId, label: t.tenantName || t.tenantId }))
      ])
    } catch {}
  }

  const loadTransactions = useCallback(async (tenantId?: string) => {
    setLoading(true)
    try {
      const url = tenantId ? `/api/payments?tenantId=${tenantId}` : '/api/payments'
      const res = await axios.get(url)
      setTransactions(res.data)
    } catch {
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTenants()
    loadTransactions()
  }, [])

  // Auto-refresh mỗi 10s nếu có giao dịch PENDING
  useEffect(() => {
    const hasPending = transactions.some(t => t.status === 'PENDING' || t.status === 'PARTIAL_PAID')
    if (!hasPending) return
    const timer = setInterval(() => loadTransactions(selectedTenant || undefined), 10000)
    return () => clearInterval(timer)
  }, [transactions, selectedTenant, loadTransactions])

  const handleRefund = async (paymentCode: string) => {
    try {
      await axios.post(`/api/payments/${paymentCode}/refund`, { reason: 'Admin refund from portal' })
      message.success('Hoàn tiền thành công!')
      loadTransactions(selectedTenant || undefined)
      setDetailModal(null)
    } catch (err: any) {
      message.error(err.response?.data?.error?.message ?? 'Hoàn tiền thất bại')
    }
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalTxn    = transactions.length
  const paidTxn     = transactions.filter(t => t.status === 'PAID').length
  const pendingTxn  = transactions.filter(t => t.status === 'PENDING').length
  const totalAmount = transactions.reduce((s, t) => s + t.amount, 0)
  const paidAmount  = transactions.reduce((s, t) => s + t.paidAmount, 0)

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns = [
    {
      title: 'Mã thanh toán',
      dataIndex: 'paymentRequestCode',
      key: 'code',
      render: (v: string) => <Text code copyable style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'amount',
      key: 'amount',
      sorter: (a: any, b: any) => a.amount - b.amount,
      render: (v: number) => <Text strong>{v.toLocaleString()} ₫</Text>,
    },
    {
      title: 'Tiến độ',
      key: 'progress',
      render: (_: any, r: any) => {
        const pct = r.amount > 0 ? Math.round((r.paidAmount / r.amount) * 100) : 0
        return (
          <div style={{ minWidth: 120 }}>
            <Progress
              percent={pct}
              size="small"
              status={r.status === 'PAID' ? 'success' : r.status === 'FAILED' ? 'exception' : r.status === 'PARTIAL_PAID' ? 'exception' : 'active'}
              format={() => `${r.paidAmount.toLocaleString()} ₫`}
            />
          </div>
        )
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Đã thanh toán',     value: 'PAID' },
        { text: 'Đang xử lý',        value: 'PENDING' },
        { text: 'Thanh toán 1 phần', value: 'PARTIAL_PAID' },
        { text: 'Thất bại',          value: 'FAILED' },
        { text: 'Đã hoàn tiền',      value: 'REFUNDED' },
        { text: 'Hoàn 1 phần',       value: 'PARTIAL_REFUND' },
      ],
      onFilter: (value: any, record: any) => record.status === value,
      render: (v: string) => {
        const cfg = STATUS_CFG[v as keyof typeof STATUS_CFG] || STATUS_CFG.PENDING
        return <Badge status={cfg.badge} text={<Tag color={cfg.color} icon={cfg.icon}>{cfg.text}</Tag>} />
      },
    },
    {
      title: 'Splits',
      dataIndex: 'splits',
      key: 'splits',
      render: (splits: any[]) => (
        <Space size={4} wrap>
          {splits.map(s => (
            <Tooltip key={s.splitCode} title={`${s.splitCode} — ${s.status}`}>
              <Tag
                color={SPLIT_STATUS_COLOR[s.status] ?? 'default'}
                style={{ fontSize: 11, cursor: 'default' }}
              >
                {s.methodId} {s.amount.toLocaleString()}₫
              </Tag>
            </Tooltip>
          ))}
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailModal(record)}>
            Chi tiết
          </Button>
          {(record.status === 'PENDING' || record.status === 'PARTIAL_PAID') && (
            <Tooltip title="Mở trang thanh toán">
              <Button
                size="small"
                type="primary"
                ghost
                icon={<LinkOutlined />}
                href={`/payment/${record.paymentRequestCode}`}
                target="_blank"
              >
                Thanh toán
              </Button>
            </Tooltip>
          )}
          {record.status === 'PAID' && (
            <Popconfirm
              title="Xác nhận hoàn tiền"
              description={`Hoàn ${record.paidAmount.toLocaleString()} ₫ cho giao dịch ${record.paymentRequestCode}?`}
              onConfirm={() => handleRefund(record.paymentRequestCode)}
              okText="Hoàn tiền"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<RollbackOutlined />}>
                Hoàn tiền
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      {/* Stats row */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Tổng giao dịch" value={totalTxn} prefix={<TransactionOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Đã thanh toán" value={paidTxn} valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />} suffix={`/ ${totalTxn}`} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Đang xử lý" value={pendingTxn} valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Tổng thu"
              value={paidAmount}
              suffix="₫"
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              formatter={v => Number(v).toLocaleString()}
            />
          </Card>
        </Col>
      </Row>

      {/* Main table */}
      <Card
        title={
          <Space>
            <TransactionOutlined />
            Giao dịch thanh toán
            {pendingTxn > 0 && (
              <Tag color="processing" icon={<SyncOutlined spin />}>
                {pendingTxn} đang xử lý — tự động làm mới
              </Tag>
            )}
          </Space>
        }
        extra={
          <Space>
            <Select
              style={{ width: 200 }}
              value={selectedTenant}
              onChange={v => { setSelectedTenant(v); loadTransactions(v || undefined) }}
              options={tenantOptions}
              placeholder="Chọn tenant"
            />
            <Button icon={<ReloadOutlined />} onClick={() => loadTransactions(selectedTenant || undefined)}>
              Làm mới
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={transactions}
          columns={columns}
          rowKey="paymentRequestCode"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          rowClassName={r => (r.status === 'PENDING' || r.status === 'PARTIAL_PAID') ? 'ant-table-row-pending' : ''}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2}>
                <Text strong>Tổng ({totalTxn} giao dịch)</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2}>
                <Text strong>{totalAmount.toLocaleString()} ₫</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3}>
                <Progress
                  percent={totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0}
                  size="small"
                  style={{ minWidth: 120 }}
                />
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} colSpan={3} />
            </Table.Summary.Row>
          )}
        />
      </Card>

      {/* Detail modal */}
      <Modal
        open={!!detailModal}
        title={
          <Space>
            <TransactionOutlined />
            Chi tiết giao dịch: <Text code>{detailModal?.paymentRequestCode}</Text>
          </Space>
        }
        onCancel={() => setDetailModal(null)}
        footer={[
          (detailModal?.status === 'PENDING' || detailModal?.status === 'PARTIAL_PAID') && (
            <Button
              key="pay"
              type="primary"
              icon={<LinkOutlined />}
              href={`/payment/${detailModal?.paymentRequestCode}`}
              target="_blank"
            >
              Mở trang thanh toán
            </Button>
          ),
          detailModal?.status === 'PAID' && (
            <Popconfirm
              key="refund-confirm"
              title="Xác nhận hoàn tiền"
              description={`Hoàn ${detailModal?.paidAmount?.toLocaleString()} ₫?`}
              onConfirm={() => handleRefund(detailModal?.paymentRequestCode)}
              okText="Hoàn tiền"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button key="refund" danger icon={<RollbackOutlined />}>
                Hoàn tiền
              </Button>
            </Popconfirm>
          ),
          <Button key="close" onClick={() => setDetailModal(null)}>Đóng</Button>
        ].filter(Boolean)}
        width={720}
      >
        {detailModal && (() => {
          const cfg = STATUS_CFG[detailModal.status as keyof typeof STATUS_CFG] || STATUS_CFG.PENDING
          const pct = detailModal.amount > 0
            ? Math.round((detailModal.paidAmount / detailModal.amount) * 100) : 0
          return (
            <>
              <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Mã thanh toán" span={2}>
                  <Text code copyable>{detailModal.paymentRequestCode}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Tổng tiền">
                  <Text strong>{detailModal.amount.toLocaleString()} ₫</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Đã thanh toán">
                  <Text type={detailModal.paidAmount === detailModal.amount ? 'success' : 'warning'} strong>
                    {detailModal.paidAmount.toLocaleString()} ₫
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Còn lại">
                  <Text type="secondary">
                    {(detailModal.amount - detailModal.paidAmount).toLocaleString()} ₫
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color={cfg.color} icon={cfg.icon}>{cfg.text}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tiến độ" span={2}>
                  <Progress percent={pct} status={detailModal.status === 'PAID' ? 'success' : 'active'} />
                </Descriptions.Item>
              </Descriptions>

              <Text strong>Chi tiết splits ({detailModal.splits.length}):</Text>
              <Table
                dataSource={detailModal.splits}
                size="small"
                pagination={false}
                style={{ marginTop: 8 }}
                rowKey="splitCode"
                columns={[
                  {
                    title: 'Split Code',
                    dataIndex: 'splitCode',
                    render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text>
                  },
                  { title: 'Phương thức', dataIndex: 'methodId' },
                  {
                    title: 'Số tiền',
                    dataIndex: 'amount',
                    render: (v: number) => <Text strong>{v.toLocaleString()} ₫</Text>
                  },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'status',
                    render: (v: string) => (
                      <Tag color={SPLIT_STATUS_COLOR[v] ?? 'default'}>{v}</Tag>
                    ),
                  },
                  {
                    title: 'Provider TxnId',
                    dataIndex: 'providerTransactionId',
                    render: (v: string) => v
                      ? <Text code style={{ fontSize: 11 }}>{v}</Text>
                      : <Text type="secondary">—</Text>
                  },
                ]}
                summary={rows => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <Text strong>Tổng</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Text strong>
                        {(rows as any[]).reduce((s: number, r: any) => s + r.amount, 0).toLocaleString()} ₫
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} colSpan={2} />
                  </Table.Summary.Row>
                )}
              />
            </>
          )
        })()}
      </Modal>
    </div>
  )
}
