import { Card, Row, Col, Statistic, Typography, Timeline, Tag, Button, Spin } from 'antd'
import {
  TeamOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  DollarOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'

const { Title, Text } = Typography

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    tenants: 0,
    paymentMethods: 0,
    providers: 0,
    totalTxn: 0,
    paidTxn: 0,
    pendingTxn: 0,
    totalAmount: 0,
    paidAmount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [tenantsRes, paymentsRes] = await Promise.all([
          axios.get('/api/payment-tenants'),
          axios.get('/api/payments'),
        ])

        const tenants: any[] = tenantsRes.data?.value ?? tenantsRes.data ?? []
        const payments: any[] = paymentsRes.data?.value ?? paymentsRes.data ?? []

        // Tổng hợp payment methods và providers từ tất cả tenants
        let totalMethods = 0
        let totalProviders = 0
        await Promise.all(tenants.map(async (t: any) => {
          try {
            const [mRes, pRes] = await Promise.all([
              axios.get(`/api/payment-tenants/${t.tenantId}/payment-methods`),
              axios.get(`/api/payment-tenants/${t.tenantId}/providers`),
            ])
            totalMethods += ((mRes.data?.value ?? mRes.data ?? []).length ?? 0)
            totalProviders += ((pRes.data?.value ?? pRes.data ?? []).length ?? 0)
          } catch {}
        }))

        const paidTxn    = payments.filter((p: any) => p.status === 'PAID').length
        const pendingTxn = payments.filter((p: any) => p.status === 'PENDING' || p.status === 'PARTIAL_PAID').length
        const totalAmount = payments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0)
        const paidAmount  = payments.reduce((s: number, p: any) => s + (p.paidAmount ?? 0), 0)

        setStats({
          tenants: tenants.length,
          paymentMethods: totalMethods,
          providers: totalProviders,
          totalTxn: payments.length,
          paidTxn,
          pendingTxn,
          totalAmount,
          paidAmount,
        })
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [])

  return (
    <div>
      {/* Stats row 1 — Cấu hình */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {[
          { title: 'Tenants',          value: stats.tenants,        icon: <TeamOutlined />,        color: '#1890ff', suffix: 'active' },
          { title: 'Payment Methods',  value: stats.paymentMethods, icon: <CreditCardOutlined />,  color: '#52c41a', suffix: 'registered' },
          { title: 'Providers',        value: stats.providers,      icon: <CheckCircleOutlined />, color: '#722ed1', suffix: 'configured' },
          { title: 'Đang xử lý',       value: stats.pendingTxn,     icon: <SyncOutlined spin={stats.pendingTxn > 0} />, color: '#fa8c16', suffix: 'giao dịch' },
        ].map(s => (
          <Col span={6} key={s.title}>
            <Card>
              <Spin spinning={loading} size="small">
                <Statistic
                  title={s.title}
                  value={s.value}
                  suffix={<Text type="secondary" style={{ fontSize: 13 }}>{s.suffix}</Text>}
                  prefix={<span style={{ color: s.color }}>{s.icon}</span>}
                  valueStyle={{ color: s.color }}
                />
              </Spin>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Stats row 2 — Giao dịch */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          { title: 'Tổng giao dịch', value: stats.totalTxn,                    icon: <ThunderboltOutlined />, color: '#595959', suffix: 'txn' },
          { title: 'Đã thanh toán',  value: stats.paidTxn,                     icon: <CheckCircleOutlined />, color: '#52c41a', suffix: `/ ${stats.totalTxn}` },
          { title: 'Tổng tiền',      value: stats.totalAmount.toLocaleString(), icon: <DollarOutlined />,      color: '#1890ff', suffix: '₫' },
          { title: 'Đã thu',         value: stats.paidAmount.toLocaleString(),  icon: <DollarOutlined />,      color: '#52c41a', suffix: '₫' },
        ].map(s => (
          <Col span={6} key={s.title}>
            <Card>
              <Spin spinning={loading} size="small">
                <Statistic
                  title={s.title}
                  value={s.value}
                  suffix={<Text type="secondary" style={{ fontSize: 13 }}>{s.suffix}</Text>}
                  prefix={<span style={{ color: s.color }}>{s.icon}</span>}
                  valueStyle={{ color: s.color }}
                />
              </Spin>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        {/* Quick Actions */}
        <Col span={10}>
          <Card title="Quick Actions" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button type="primary" block icon={<TeamOutlined />} onClick={() => navigate('/portal/tenants')}>
                Register New Tenant
              </Button>
              <Button block icon={<CreditCardOutlined />} onClick={() => navigate('/portal/payment-methods')}>
                Manage Payment Methods
              </Button>
              <Button block icon={<SettingOutlined />} onClick={() => navigate('/portal/providers')}>
                Configure Providers
              </Button>
              <Button type="dashed" block icon={<ThunderboltOutlined />} onClick={() => navigate('/portal/test-payment')}>
                Test Payment Flow
              </Button>
            </div>
          </Card>
        </Col>

        {/* Capabilities */}
        <Col span={14}>
          <Card title="8 Capabilities — Demo Ready">
            <Timeline
              items={[
                { color: 'green', children: <><Tag color="green">✅</Tag> <Text strong>Multi-tenant</Text> — 8 tenants isolated</> },
                { color: 'green', children: <><Tag color="green">✅</Tag> <Text strong>Payment Methods</Text> — CASH, ZaloPay, MoMo</> },
                { color: 'green', children: <><Tag color="green">✅</Tag> <Text strong>Provider Registration</Text> — Adapter pattern</> },
                { color: 'green', children: <><Tag color="green">✅</Tag> <Text strong>Config Storage</Text> — KMS references, no plaintext</> },
                { color: 'green', children: <><Tag color="green">✅</Tag> <Text strong>Payment Link</Text> — Generated in 120ms</> },
                { color: 'green', children: <><Tag color="green">✅</Tag> <Text strong>Payment Page</Text> — Responsive, tenant-branded</> },
                { color: 'green', children: <><Tag color="green">✅</Tag> <Text strong>Split Payment</Text> — Multi-method per transaction</> },
                { color: 'green', children: <><Tag color="green">✅</Tag> <Text strong>Webhook Callback</Text> — Idempotent, 24h TTL</> },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

