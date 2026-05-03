import { Card, Row, Col, Statistic, Typography, Timeline, Tag, Button } from 'antd'
import {
  TeamOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div>
      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          { title: 'Tenants', value: 8, icon: <TeamOutlined />, color: '#1890ff', suffix: 'active' },
          { title: 'Payment Methods', value: 3, icon: <CreditCardOutlined />, color: '#52c41a', suffix: 'registered' },
          { title: 'Providers', value: 2, icon: <CheckCircleOutlined />, color: '#722ed1', suffix: 'configured' },
          { title: 'Avg Latency', value: 120, icon: <ThunderboltOutlined />, color: '#fa8c16', suffix: 'ms' },
        ].map(s => (
          <Col span={6} key={s.title}>
            <Card>
              <Statistic
                title={s.title}
                value={s.value}
                suffix={<Text type="secondary" style={{ fontSize: 13 }}>{s.suffix}</Text>}
                prefix={<span style={{ color: s.color }}>{s.icon}</span>}
                valueStyle={{ color: s.color }}
              />
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

