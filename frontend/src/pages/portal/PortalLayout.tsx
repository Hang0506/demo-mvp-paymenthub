import { Layout, Menu, Typography, Avatar, Space, Tag } from 'antd'
import {
  TeamOutlined,
  CreditCardOutlined,
  SettingOutlined,
  DashboardOutlined,
  ApiOutlined,
  UnorderedListOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'

const { Sider, Content } = Layout
const { Title, Text } = Typography

const menuItems = [
  { key: '/portal',                  icon: <DashboardOutlined />,    label: 'Dashboard' },
  { key: '/portal/tenants',          icon: <TeamOutlined />,         label: 'Tenants' },
  { key: '/portal/payment-methods',  icon: <CreditCardOutlined />,   label: 'Payment Methods' },
  { key: '/portal/providers',        icon: <SettingOutlined />,      label: 'Providers' },
  { key: '/portal/test-payment',     icon: <ApiOutlined />,          label: 'Test Payment' },
  { key: '/portal/transactions',     icon: <UnorderedListOutlined />, label: 'Transactions' },
]

const PAGE_TITLES: Record<string, string> = {
  '/portal':                 'Dashboard',
  '/portal/tenants':         'Tenants',
  '/portal/payment-methods': 'Payment Methods',
  '/portal/providers':       'Provider Config',
  '/portal/test-payment':    'Test Payment',
  '/portal/transactions':    'Transactions',
}

export default function PortalLayout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Portal'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ── Sidebar ── */}
      <Sider width={240} className="portal-sider">
        {/* Logo */}
        <div className="portal-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>
              💳
            </div>
            <div>
              <Title level={5} className="portal-logo-title">Payment Hub</Title>
              <div className="portal-logo-badge">Admin Portal</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: '12px 0' }}>
          <Text style={{ color: '#475569', fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', padding: '8px 20px', display: 'block' }}>
            Navigation
          </Text>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems.map(item => ({
              ...item,
              style: { borderRadius: '0 8px 8px 0', margin: '2px 8px 2px 0', paddingLeft: 20 },
            }))}
            onClick={({ key }) => navigate(key)}
            style={{ background: 'transparent', border: 'none' }}
          />
        </div>

        {/* Footer */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px', borderTop: '1px solid #1e293b' }}>
          <Text style={{ color: '#475569', fontSize: 11 }}>v1.0.0 · MVP Demo</Text>
        </div>
      </Sider>

      {/* ── Main ── */}
      <Layout>
        {/* Header */}
        <div className="portal-header" style={{
          height: 64, background: '#fff',
          padding: '0 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <div>
            <Title level={4} style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>
              {pageTitle}
            </Title>
          </div>
          <Space size={16}>
            <Tag color="green" style={{ borderRadius: 20, padding: '2px 10px', fontWeight: 500 }}>
              ● Live
            </Tag>
            <Avatar
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', cursor: 'pointer' }}
              size={36}
            >
              A
            </Avatar>
          </Space>
        </div>

        {/* Content */}
        <Content className="portal-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
