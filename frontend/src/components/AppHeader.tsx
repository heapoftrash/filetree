import { useNavigate } from 'react-router-dom'
import { Layout, Button, Space, Avatar, Badge, Dropdown, Tag, theme } from 'antd'
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BulbOutlined,
  BulbFilled,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const { Header } = Layout

interface AppHeaderProps {
  leftExtra?: React.ReactNode
  showSidebarToggle?: boolean
  sidebarVisible?: boolean
  onSidebarToggle?: () => void
  rightActions?: React.ReactNode
}

export default function AppHeader({
  leftExtra,
  showSidebarToggle,
  sidebarVisible,
  onSidebarToggle,
  rightActions,
}: AppHeaderProps) {
  const { token } = theme.useToken()
  const { user, logout } = useAuth()
  const { mode, toggleMode } = useTheme()
  const navigate = useNavigate()

  const displayName = user?.name || user?.email || 'Account'
  const initial = (displayName.charAt(0) || '?').toUpperCase()

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: token.colorBgContainer,
        color: token.colorText,
      }}
    >
      {showSidebarToggle && onSidebarToggle !== undefined && (
        <Button
          type="text"
          icon={sidebarVisible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          onClick={onSidebarToggle}
          style={{ color: token.colorText }}
          title={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
        />
      )}
      {leftExtra}
      <a
        href="/files"
        onClick={(e) => {
          e.preventDefault()
          navigate('/files')
        }}
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: token.colorText,
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
        title="Home"
      >
        <img
          src="/icon-light.svg"
          alt=""
          style={{ width: 36, height: 41, objectFit: 'contain', display: 'block' }}
        />
        Filetree
      </a>
      <div style={{ flex: 1 }} />
      <Space>
        {rightActions}
        <Button
          type="text"
          icon={mode === 'dark' ? <BulbFilled /> : <BulbOutlined />}
          onClick={toggleMode}
          title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{ color: token.colorText }}
        />
        {user?.is_admin && (
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => navigate('/settings')}
            title="Settings"
            style={{ color: token.colorText }}
          />
        )}
        <Dropdown
          menu={{
            items: [
              {
                key: 'userinfo',
                label: (
                  <div style={{ padding: '4px 0', minWidth: 200 }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{user?.name || 'User'}</div>
                    <div style={{ fontSize: 12, color: token.colorTextSecondary }}>{user?.email}</div>
                    <div style={{ marginTop: 6 }}>
                      <Tag color={user?.is_admin ? 'red' : 'blue'}>
                        {user?.is_admin ? 'Admin' : 'User'}
                      </Tag>
                    </div>
                  </div>
                ),
                disabled: true,
              },
              { type: 'divider' },
              { key: 'logout', label: 'Sign out', icon: <LogoutOutlined />, onClick: logout },
            ],
          }}
          placement="bottomRight"
        >
          <Space style={{ cursor: 'pointer' }} size={8}>
            {user?.is_admin ? (
              <Badge dot count={1} title="Admin">
                <Avatar
                  src={
                    user?.picture ? (
                      <img
                        src={user.picture}
                        alt=""
                        referrerPolicy="no-referrer"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : undefined
                  }
                  style={user?.picture ? undefined : { backgroundColor: token.colorPrimary }}
                >
                  {!user?.picture ? initial : undefined}
                </Avatar>
              </Badge>
            ) : (
              <Avatar
                src={
                  user?.picture ? (
                    <img
                      src={user.picture}
                      alt=""
                      referrerPolicy="no-referrer"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : undefined
                }
                style={user?.picture ? undefined : { backgroundColor: token.colorPrimary }}
              >
                {!user?.picture ? initial : undefined}
              </Avatar>
            )}
            <span style={{ color: token.colorText }}>{displayName}</span>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  )
}
