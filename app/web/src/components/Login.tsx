import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Card, Button, Spin, Alert, Typography, Space, Form, Input, Divider, theme } from 'antd'
import { GoogleOutlined, GithubOutlined, LockOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { getLoginOptions, type LoginOptions } from '../api/client'
import { getApiErrorMessage } from '../utils/errors'

const { Content } = Layout
const { Title, Text } = Typography

const errorMessages: Record<string, string> = {
  config: 'OAuth not configured. Set GOOGLE_CLIENT_ID.',
  no_code: 'Authentication was cancelled.',
  exchange: 'Failed to complete sign in.',
  userinfo: 'Failed to get user info.',
  token: 'Failed to create session.',
  oauth_no_allowlist:
    'OAuth sign-in is not configured: add at least one admin or allowed OAuth email in Settings (or contact an administrator).',
  oauth_not_allowed: 'This account is not allowed to sign in. Contact an administrator if you need access.',
}

export default function Login() {
  const { token } = theme.useToken()
  const { isAuthenticated, loading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from || '/files'

  const [options, setOptions] = useState<LoginOptions | null>(null)
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [localError, setLocalError] = useState<string | null>(null)
  const [localSubmitting, setLocalSubmitting] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    getLoginOptions()
      .then(setOptions)
      .catch(() => setOptions({ local_auth_enabled: false, providers: [] }))
      .finally(() => setOptionsLoading(false))
  }, [])

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [loading, isAuthenticated, navigate, from])

  const params = new URLSearchParams(location.search)
  const error = params.get('error')
  const errorMessage = error ? (errorMessages[error] ?? 'Sign in failed.') : null

  const onLocalFinish = async (values: { username: string; password: string }) => {
    setLocalError(null)
    setLocalSubmitting(true)
    try {
      await login('local', { username: values.username, password: values.password })
    } catch (e) {
      setLocalError(getApiErrorMessage(e))
    } finally {
      setLocalSubmitting(false)
    }
  }

  const hasLocalAuth = options?.local_auth_enabled ?? false
  const oauthProviders = options?.providers ?? []
  const hasOAuth = oauthProviders.length > 0
  const hasAnyAuth = hasLocalAuth || hasOAuth

  if (loading || optionsLoading) {
    return (
      <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
        <Content
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <Spin size="large" tip="Loading..." />
        </Content>
      </Layout>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      <Content
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Card style={{ maxWidth: 400, width: '100%' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <img
                src="/favicon.svg"
                alt="Filetree"
                draggable={false}
                style={{ width: 64, height: 64, marginBottom: 16 }}
              />
              <Title level={2} style={{ marginBottom: 8 }}>
                Filetree
              </Title>
              <Text type="secondary">Sign in to access your files</Text>
            </div>

            {(errorMessage || localError) && (
              <Alert
                type="error"
                message={errorMessage ?? localError}
                showIcon
                onClose={() => {
                  if (localError) setLocalError(null)
                }}
              />
            )}

            {!hasAnyAuth && (
              <Alert
                type="info"
                message="No login methods configured"
                description="Contact your administrator to enable local users or OAuth."
                showIcon
              />
            )}

            {hasLocalAuth && (
              <Form
                form={form}
                onFinish={onLocalFinish}
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: 'Username required' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Username" autoComplete="username" />
                </Form.Item>
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: 'Password required' }]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Password" autoComplete="current-password" />
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={localSubmitting}
                    style={{ height: 48, fontSize: 16 }}
                  >
                    Sign in
                  </Button>
                </Form.Item>
              </Form>
            )}

            {hasLocalAuth && hasOAuth && (
              <Divider plain>
                <Text type="secondary">or</Text>
              </Divider>
            )}

            {oauthProviders.map((p) => (
              <Button
                key={p.id}
                size="large"
                block
                icon={p.id === 'google' ? <GoogleOutlined /> : p.id === 'github' ? <GithubOutlined /> : undefined}
                onClick={() => login(p.id as 'google' | 'github')}
                style={{ height: 48, fontSize: 16 }}
              >
                Sign in with {p.label}
              </Button>
            ))}
          </Space>
        </Card>
      </Content>
    </Layout>
  )
}
