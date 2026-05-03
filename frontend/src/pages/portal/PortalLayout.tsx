import { Layout, Menu, Typography, Tag } from 'antd'
import {
  TeamOutlined,
  CreditCardOutlined,
  SettingOutlined,
  DashboardOutlined,
  ApiOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'

const { Header, Sider, Content } = Layout
const { Title } = Typography

const menuItems = [
  { key: '/portal', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/portal/tenants', icon: <TeamOutlined />, label: 'Tenants' },
  { key: '/portal/payment-methods', icon: <CreditCardOutlined />, label: 'Payment Methods' },
  { key: '/portal/providers', icon: <SettingOutlined />, label: 'Provider Config' },
  { key: '/portal/test-payment', icon: <ApiOutlined />, label: 'Test Payment' },
  { key: '/portal/transactions', icon: <UnorderedListOutlined />, label: 'Giao dịch' },
]

export default function PortalLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} style={{ background: '#001529' }}>
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #1f3a5f' }}>
          <Title level={5} style={{ color: '#fff', margin: 0 }}>
            💳 Payment Hub
          </Title>
          <Tag color="blue" style={{ marginTop: 6, fontSize: 11 }}>Admin Portal</Tag>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ marginTop: 8 }}
        />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            {menuItems.find(m => m.key === location.pathname)?.label ?? 'Portal'}
          </Title>
        </Header>
        <Content style={{ margin: 24, background: '#f5f5f5', minHeight: 'calc(100vh - 112px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}