import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layout,
  Card,
  Form,
  Input,
  Switch,
  Button,
  message,
  Spin,
  Typography,
  Space,
  Segmented,
  Menu,
  theme,
  Row,
  Col,
} from 'antd'
import {
  CloudServerOutlined,
  DeleteOutlined,
  SafetyOutlined,
  GoogleOutlined,
  GithubOutlined,
  UserOutlined,
  TeamOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import AppHeader from './AppHeader'
import {
  getConfig,
  updateConfig,
  type ConfigAPIResponse,
  type ConfigFieldSchema,
  type ProviderSectionResponse,
} from '../api/client'
import { getApiErrorMessage } from '../utils/errors'
import { bytesToHuman, humanToBytes } from '../utils/formatBytes'

const { Content } = Layout
const { Title, Text } = Typography

const SECTION_ICONS: Record<string, React.ReactNode> = {
  server: <CloudServerOutlined />,
  auth_providers: <SafetyOutlined />,
  users: <TeamOutlined />,
}

const TOP_LEVEL_SECTIONS = [
  { id: 'server', label: 'Server' },
  { id: 'auth_providers', label: 'Auth Providers' },
  { id: 'users', label: 'Users' },
] as const

const AUTH_PROVIDER_MENU_ITEMS = [
  { key: 'google', label: 'Google', icon: <GoogleOutlined /> },
  { key: 'github', label: 'GitHub', icon: <GithubOutlined /> },
] as const

const USERS_MENU_ITEMS = [
  { key: 'admin_user', label: 'Admin user', icon: <UserOutlined /> },
  { key: 'local_user', label: 'Local user', icon: <TeamOutlined /> },
] as const

const SECTION_OPTIONS = TOP_LEVEL_SECTIONS.map((s) => ({
  label: s.label,
  value: s.id,
  icon: SECTION_ICONS[s.id],
}))

type AuthProviderSubSection = 'google' | 'github'
type UsersSubSection = 'admin_user' | 'local_user'

function buildFormValues(res: ConfigAPIResponse): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const values = res.values as Record<string, Record<string, unknown>>

  for (const [section, sectionValues] of Object.entries(values)) {
    if (!sectionValues || typeof sectionValues !== 'object') continue
    const sectionOut: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(sectionValues)) {
      const field = res.schema.fields?.find((f) => f.section === section && f.key === key)
      if (field?.kind === 'bytes' && typeof val === 'number') {
        sectionOut[key] = bytesToHuman(val)
      } else if (field?.kind === 'string[]' && key === 'admin_emails') {
        const arr = Array.isArray(val) ? (val as string[]) : []
        sectionOut[key] = arr.length ? arr : ['']
      } else if (key === 'default_admin_password') {
        sectionOut[key] = ''
      } else if (key === 'local_users') {
        const arr = Array.isArray(val) ? val : []
        sectionOut[key] = arr.map((u: Record<string, unknown>) => ({
          username: u.username ?? '',
          password: '',
          is_admin: u.is_admin ?? false,
          password_set: !!u.password_set,
        }))
      } else {
        sectionOut[key] = val
      }
    }
    out[section] = sectionOut
  }

  if (values.auth_providers && typeof values.auth_providers === 'object') {
    const authProvidersOut: Record<string, Record<string, unknown>> = {}
    for (const [pid, pv] of Object.entries(values.auth_providers)) {
      if (pv && typeof pv === 'object') {
        authProvidersOut[pid] = { ...pv, client_secret: '' }
      }
    }
    out.auth_providers = authProvidersOut
  }

  return out
}

function categoryForField(name: (string | number)[]): {
  section: string
  authProviderSub?: AuthProviderSubSection
  usersSub?: UsersSubSection
} {
  const first = name[0]
  if (typeof first !== 'string') return { section: 'server' }
  if (first === 'server') return { section: 'server' }
  if (first === 'auth' || first === 'auth_providers') return { section: 'auth_providers', authProviderSub: 'google' }
  if (first === 'users') {
    const key = name[1]
    if (key === 'admin_emails' || key === 'default_admin_username' || key === 'default_admin_password') {
      return { section: 'users', usersSub: 'admin_user' }
    }
    return { section: 'users', usersSub: 'local_user' }
  }
  return { section: 'auth_providers', authProviderSub: 'google' }
}

export default function Settings() {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<ConfigAPIResponse | null>(null)
  const [activeSection, setActiveSection] = useState<string>('server')
  const [authProviderSub, setAuthProviderSub] = useState<AuthProviderSubSection>('google')
  const [usersSub, setUsersSub] = useState<UsersSubSection>('admin_user')

  // Must be called unconditionally (Rules of Hooks) - before any early returns
  const localAuthEnabled =
    Form.useWatch(['auth', 'local_auth_enabled'], form) ??
    (config?.values as Record<string, Record<string, unknown>>)?.auth?.local_auth_enabled

  const authProviders = Form.useWatch(['auth_providers'], form) ?? (config?.values as Record<string, Record<string, unknown>>)?.auth_providers
  const localUsersFormValues = (Form.useWatch(['users', 'local_users'], form) ?? []) as Array<Record<string, unknown>>
  const oauthEnabled =
    (authProviders && typeof authProviders === 'object' &&
      ((authProviders as Record<string, Record<string, unknown>>).google?.enabled === true ||
        (authProviders as Record<string, Record<string, unknown>>).github?.enabled === true)) ??
    false

  useEffect(() => {
    getConfig()
      .then((res) => {
        setConfig(res)
        const initialValues = buildFormValues(res)
        form.setFieldsValue(initialValues)
      })
      .catch((e) => message.error(getApiErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [form])

  const onFinish = useCallback(async (values: Record<string, unknown>) => {
    if (!config) return
    setSaving(true)
    try {
      // Validate admin_emails only when OAuth is enabled
      const authProvidersVal = values.auth_providers as Record<string, Record<string, unknown>> | undefined
      const hasOAuth =
        authProvidersVal &&
        (authProvidersVal.google?.enabled === true || authProvidersVal.github?.enabled === true)
      const users = values.users as Record<string, unknown> | undefined
      if (hasOAuth && users?.admin_emails !== undefined) {
        const emails = (Array.isArray(users.admin_emails) ? users.admin_emails : []).filter(
          (e: unknown) => typeof e === 'string' && e.trim(),
        )
        if (emails.length === 0) {
          message.error('At least one admin email is required when OAuth is enabled')
          setActiveSection('users')
          setUsersSub('admin_user')
          setSaving(false)
          return
        }
      }

      const payload: Record<string, unknown> = {}
      const schema = config.schema

      for (const [section, sectionValues] of Object.entries(values)) {
        if (!sectionValues || typeof sectionValues !== 'object') continue
        const sectionOut: Record<string, unknown> = {}
        const fields = schema.fields?.filter((f) => f.section === section) ?? []
        const isProviderSection = section === 'auth_providers'

        if (isProviderSection) {
          payload[section] = sectionValues
          continue
        }

        for (const [key, val] of Object.entries(sectionValues as Record<string, unknown>)) {
          const field = fields.find((f) => f.key === key)
          if (field && !field.editable && !isProviderSection) continue
          if (field?.kind === 'bytes' && typeof val === 'string') {
            const bytes = humanToBytes(val)
            if (bytes !== null) sectionOut[key] = bytes
          } else if (key === 'default_admin_password' && (val === '' || val == null)) {
            continue
          } else if (key === 'local_users') {
            const arr = Array.isArray(val) ? val : []
            sectionOut[key] = arr
              .filter((u: Record<string, unknown>) => String(u?.username ?? '').trim())
              .map((u: Record<string, unknown>) => ({
                username: String(u.username ?? '').trim(),
                password: u.password ?? '',
                is_admin: Boolean(u.is_admin),
              }))
          } else {
            sectionOut[key] = val
          }
        }
        payload[section] = sectionOut
      }

      await updateConfig(payload as Record<string, Record<string, unknown>>)
      message.success('Config saved. Server restart may be required for some changes.')
      // Sanitize: never keep client_secret in state; use client_secret_set instead.
      // client_secret_set is not a form field (ProviderField shows static "Set" when already saved),
      // so preserve it from previous config.values to avoid reverting to undefined.
      const sanitizedPayload = { ...payload }
      if (sanitizedPayload.auth_providers && typeof sanitizedPayload.auth_providers === 'object') {
        const ap = sanitizedPayload.auth_providers as Record<string, Record<string, unknown>>
        const prevAuthProviders = (config.values as Record<string, Record<string, unknown>>)?.auth_providers as Record<string, Record<string, unknown>> | undefined
        const sanitized: Record<string, Record<string, unknown>> = {}
        for (const [pid, pv] of Object.entries(ap)) {
          if (pv && typeof pv === 'object') {
            const { client_secret, ...rest } = pv
            const prevClientSecretSet = prevAuthProviders?.[pid]?.client_secret_set === true
            sanitized[pid] = {
              ...rest,
              client_secret: '',
              client_secret_set: (typeof client_secret === 'string' && client_secret.trim() !== '') || prevClientSecretSet,
            }
          }
        }
        sanitizedPayload.auth_providers = sanitized
      }
      setConfig({ ...config, values: { ...config.values, ...sanitizedPayload } })
    } catch (e) {
      message.error(getApiErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }, [config])

  const onFinishFailed = useCallback((info: { errorFields: { name: (string | number)[] }[] }) => {
    const firstError = info.errorFields[0]
    if (firstError) {
      const { section, authProviderSub, usersSub } = categoryForField(firstError.name)
      setActiveSection(section)
      if (authProviderSub) setAuthProviderSub(authProviderSub)
      if (usersSub) setUsersSub(usersSub)
      message.warning('Please fix the validation errors before saving.')
    }
  }, [])

  const fieldsBySection = useMemo(
    () =>
      (config?.schema?.fields ?? []).reduce(
        (acc, f) => {
          if (!acc[f.section]) acc[f.section] = []
          acc[f.section].push(f)
          return acc
        },
        {} as Record<string, ConfigFieldSchema[]>,
      ),
    [config?.schema?.fields],
  )

  const { authFieldsWithoutLocal, localAuthField } = useMemo(() => {
    const auth = fieldsBySection.auth ?? []
    return {
      authFieldsWithoutLocal: auth.filter((f) => f.key !== 'local_auth_enabled'),
      localAuthField: auth.filter((f) => f.key === 'local_auth_enabled'),
    }
  }, [fieldsBySection.auth])

  const adminUserFields = useMemo(() => {
    const users = fieldsBySection.users ?? []
    return users
      .filter((f) => ['admin_emails', 'default_admin_username', 'default_admin_password'].includes(f.key))
      .sort((a, b) => {
        const order = ['admin_emails', 'default_admin_username', 'default_admin_password']
        return order.indexOf(a.key) - order.indexOf(b.key)
      })
  }, [fieldsBySection.users])

  const localUsersFields = useMemo(
    () => (fieldsBySection.users ?? []).filter((f) => f.key === 'local_users'),
    [fieldsBySection.users],
  )

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
        <AppHeader />
        <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Spin size="large" tip="Loading settings..." />
        </Content>
      </Layout>
    )
  }

  if (!config) return null

  const values = config.values as Record<string, Record<string, unknown>>

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      <AppHeader />
      <Content style={{ padding: 24, maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <Title level={3} style={{ marginBottom: 12 }}>
          Settings
        </Title>
        <Card size="small">
          <Segmented
            value={activeSection}
            onChange={(v) => setActiveSection(v as string)}
            options={SECTION_OPTIONS}
            block
            size="middle"
            style={{ marginBottom: 16 }}
          />
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            Changes may require a server restart to take effect.
          </Text>
          <Form
            form={form}
            layout="vertical"
            size="small"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
          >
            {activeSection === 'server' && (
              <div>
                {(fieldsBySection.server ?? []).map((field) => (
                  <ConfigField
                    key={`server.${field.key}`}
                    sectionId="server"
                    field={field}
                    values={values}
                    localAuthEnabled={localAuthEnabled}
                    addButtonPosition={field.key === 'cors_origins' ? 'right' : undefined}
                  />
                ))}
              </div>
            )}
            {activeSection === 'auth_providers' && (
              <Row gutter={24} style={{ marginTop: 8 }}>
                <Col flex="0 0 180px">
                  <Menu
                    mode="inline"
                    selectedKeys={[authProviderSub]}
                    onClick={({ key }) => setAuthProviderSub(key as AuthProviderSubSection)}
                    style={{ border: 'none', background: 'transparent' }}
                    items={[...AUTH_PROVIDER_MENU_ITEMS]}
                  />
                </Col>
                <Col flex="1" style={{ minWidth: 0 }}>
                  {authFieldsWithoutLocal.map((field) => (
                    <ConfigField
                      key={`auth.${field.key}`}
                      sectionId="auth"
                      field={field}
                      values={values}
                      localAuthEnabled={localAuthEnabled}
                    />
                  ))}
                  {(config.schema.provider_sections ?? []).map((ps) => (
                    <ProviderSection
                      key={ps.id}
                      providerSection={ps}
                      values={values}
                      selectedProvider={authProviderSub}
                    />
                  ))}
                </Col>
              </Row>
            )}
            {activeSection === 'users' && (
              <Row gutter={24} style={{ marginTop: 8 }}>
                <Col flex="0 0 180px">
                  <Menu
                    mode="inline"
                    selectedKeys={[usersSub]}
                    onClick={({ key }) => setUsersSub(key as UsersSubSection)}
                    style={{ border: 'none', background: 'transparent' }}
                    items={[...USERS_MENU_ITEMS]}
                  />
                </Col>
                <Col flex="1" style={{ minWidth: 0 }}>
                  {usersSub === 'admin_user' && (
                    <>
                      {adminUserFields.map((field) => (
                        <ConfigField
                          key={`users.${field.key}`}
                          sectionId="users"
                          field={field}
                          values={values}
                          localAuthEnabled={localAuthEnabled}
                          oauthEnabled={oauthEnabled}
                          addButtonPosition="right"
                        />
                      ))}
                    </>
                  )}
                  {usersSub === 'local_user' && (
                    <>
                      {localAuthField.map((field) => (
                        <ConfigField
                          key={`auth.${field.key}`}
                          sectionId="auth"
                          field={field}
                          values={values}
                          localAuthEnabled={localAuthEnabled}
                        />
                      ))}
                      {localUsersFields.map((field) => (
                        <ConfigField
                          key={`users.${field.key}`}
                          sectionId="users"
                          field={field}
                          values={values}
                          localAuthEnabled={localAuthEnabled}
                          addButtonPosition="right"
                          localUsersFormValues={localUsersFormValues}
                        />
                      ))}
                    </>
                  )}
                </Col>
              </Row>
            )}
            <Form.Item style={{ marginTop: 16 }}>
              <Space>
                <Button type="primary" htmlType="submit" loading={saving}>
                  Save
                </Button>
                <Button onClick={() => navigate('/files')}>Cancel</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  )
}

const ProviderSection = React.memo(function ProviderSection({
  providerSection,
  values,
  selectedProvider,
}: {
  providerSection: ProviderSectionResponse
  values: Record<string, Record<string, unknown>>
  selectedProvider: string
}) {
  const providerValues = (values[providerSection.id] ?? {}) as Record<string, Record<string, unknown>>
  const oauthProviders = providerSection.providers.filter((p) => p.id !== 'local')
  const provider = oauthProviders.find((p) => p.id === selectedProvider)
  if (!provider || oauthProviders.length === 0) return null
  return (
    <Form.Item label={providerSection.label} style={{ marginTop: 16 }}>
      <Card size="small" title={provider.label} style={{ marginBottom: 0 }}>
        {provider.fields.map((f) => (
          <ProviderField
            key={f.key}
            providerId={provider.id}
            field={f}
            value={providerValues[provider.id]?.[f.key]}
            providerValues={providerValues[provider.id] ?? {}}
          />
        ))}
      </Card>
    </Form.Item>
  )
})

const ProviderField = React.memo(function ProviderField({
  providerId,
  field,
  value,
  providerValues,
}: {
  providerId: string
  field: ConfigFieldSchema
  value: unknown
  providerValues: Record<string, unknown>
}) {
  const namePath = ['auth_providers', providerId, field.key]

  // client_secret: backend only accepts value when empty; once saved it cannot be changed
  if (field.key === 'client_secret') {
    const clientSecretSet = !!providerValues.client_secret_set
    return (
      <Form.Item
        name={namePath}
        label={field.label}
        extra={clientSecretSet ? 'Value is set. Cannot be changed after save.' : 'Enter client secret to save.'}
        style={{ marginBottom: 12 }}
      >
        <Input.Password
          placeholder={clientSecretSet ? '••••••••' : undefined}
          autoComplete="new-password"
          size="small"
          disabled={clientSecretSet}
        />
      </Form.Item>
    )
  }

  if (field.secret && !field.editable) {
    const isSet = !!value
    return (
      <Form.Item label={field.label} extra={isSet ? 'Value is set.' : 'Not set.'} style={{ marginBottom: 12 }}>
        <Input.Password placeholder={isSet ? '••••••••' : undefined} disabled size="small" />
      </Form.Item>
    )
  }

  if (field.kind === 'bool') {
    return (
      <Form.Item name={namePath} label={field.label} valuePropName="checked" style={{ marginBottom: 12 }}>
        <Switch checkedChildren="On" unCheckedChildren="Off" size="small" />
      </Form.Item>
    )
  }

  return (
    <Form.Item
      name={namePath}
      label={field.label}
      extra={field.extra}
      style={{ marginBottom: 12 }}
    >
      <Input placeholder={field.placeholder} disabled={!field.editable} size="small" />
    </Form.Item>
  )
})

const ConfigField = React.memo(function ConfigField({
  sectionId,
  field,
  values,
  localAuthEnabled = false,
  oauthEnabled = true,
  addButtonPosition,
  localUsersFormValues = [],
}: {
  sectionId: string
  field: ConfigFieldSchema
  values: Record<string, Record<string, unknown>>
  localAuthEnabled?: boolean
  oauthEnabled?: boolean
  addButtonPosition?: 'right'
  localUsersFormValues?: Array<Record<string, unknown>>
}) {
  const { token } = theme.useToken()
  const sectionValues = values[sectionId] ?? {}
  const rawValue = sectionValues[field.key]

  if (field.secret && !field.editable) {
    const isSet = !!rawValue
    return (
      <Form.Item label={field.label} key={field.key} extra={isSet ? 'Value is set.' : 'Not set.'} style={{ marginBottom: 12 }}>
        <Input.Password placeholder={isSet ? '••••••••' : undefined} disabled size="small" />
      </Form.Item>
    )
  }

  if (field.key === 'default_admin_password') {
    const isSet = !!rawValue
    return (
      <Form.Item
        name={[sectionId, field.key]}
        label={field.label}
        extra={isSet ? 'Value is set. Enter a new value to change it.' : 'Enter password for first-time setup.'}
        style={{ marginBottom: 12 }}
      >
        <Input.Password placeholder={isSet ? '••••••••' : undefined} autoComplete="new-password" size="small" />
      </Form.Item>
    )
  }

  const namePath = [sectionId, field.key]

  if (field.kind === 'bool') {
    return (
      <Form.Item name={namePath} label={field.label} valuePropName="checked" style={{ marginBottom: 12 }}>
        <Switch checkedChildren="On" unCheckedChildren="Off" size="small" />
      </Form.Item>
    )
  }

  if (field.kind === 'string[]') {
    const arr = Array.isArray(rawValue) ? rawValue : []
    const list = arr.filter((x): x is string => typeof x === 'string')
    const isAdminEmails = field.key === 'admin_emails'
    const adminEmailsDisabled = isAdminEmails && !oauthEnabled
    const initialList = isAdminEmails && list.length === 0 ? [''] : list
    const labelInRow = addButtonPosition === 'right'
    return (
      <Form.Item
        label={labelInRow ? null : field.label}
        required={isAdminEmails && oauthEnabled}
        extra={adminEmailsDisabled ? 'Enable an OAuth provider (Google or GitHub) to add admin emails.' : undefined}
        style={{ marginBottom: 12 }}
      >
        <Form.List name={namePath} initialValue={initialList}>
          {(fields, { add, remove }, { errors }) => (
            <>
              {labelInRow && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: token.colorText }}>
                    {field.label}
                    {isAdminEmails && oauthEnabled && <span style={{ color: token.colorError, marginLeft: 4 }}>*</span>}
                  </span>
                  <Button size="small" type="default" icon={<PlusOutlined />} onClick={() => add('')} disabled={adminEmailsDisabled}>
                    Add
                  </Button>
                </div>
              )}
              <Form.ErrorList errors={errors} />
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 6 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name]}
                    rules={isAdminEmails && oauthEnabled ? [{ required: true, message: 'Email required' }] : undefined}
                    style={{ marginBottom: 0, minWidth: 240, flex: 1 }}
                  >
                    <Input
                      placeholder={isAdminEmails ? 'admin@example.com' : field.placeholder}
                      type={isAdminEmails ? 'email' : 'text'}
                      size="small"
                      disabled={adminEmailsDisabled}
                    />
                  </Form.Item>
                  <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(name)} disabled={adminEmailsDisabled}>
                    Remove
                  </Button>
                </Space>
              ))}
              {!labelInRow && (
                <Form.Item style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Button size="small" type="default" icon={<PlusOutlined />} onClick={() => add('')}>
                      Add
                    </Button>
                  </div>
                </Form.Item>
              )}
            </>
          )}
        </Form.List>
      </Form.Item>
    )
  }

  if (field.kind === 'object[]' && field.key === 'local_users') {
    const arr = Array.isArray(rawValue) ? rawValue : []
    const list = arr.map((u: Record<string, unknown>) => ({
      username: u.username ?? '',
      password: '',
      is_admin: u.is_admin ?? false,
      password_set: !!u.password_set,
    }))
    const addInLabelRow = addButtonPosition === 'right'
    return (
      <Form.Item
        label={addInLabelRow ? null : field.label}
        extra={!localAuthEnabled ? 'Enable "Local users enabled" above to add local users.' : undefined}
      >
        <Form.List name={namePath} initialValue={list.length ? list : [{ username: '', password: '', is_admin: false }]}>
          {(fields, { add, remove }) => (
            <>
              {addInLabelRow && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: token.colorText }}>{field.label}</span>
                  <Button
                    size="small"
                    type="default"
                    icon={<PlusOutlined />}
                    onClick={() => add({ username: '', password: '', is_admin: false })}
                    disabled={!localAuthEnabled}
                  >
                    Add user
                  </Button>
                </div>
              )}
              {fields.map(({ key, name, ...restField }) => {
                const item = localUsersFormValues[name]
                const passwordSet = !!item?.password_set
                return (
                <Card key={key} size="small" style={{ marginBottom: 6 }}>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Row gutter={12} wrap>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item {...restField} name={[name, 'username']} label="Username" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                          <Input placeholder="username" size="small" disabled={!localAuthEnabled || passwordSet} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'password']}
                          label="Password"
                          rules={!passwordSet ? [{ required: true, message: 'Password is required for new users' }] : undefined}
                          extra={passwordSet ? 'Value is set. Enter a new value to change it.' : undefined}
                          style={{ marginBottom: 0 }}
                        >
                          <Input.Password
                            placeholder={passwordSet ? '••••••••' : undefined}
                            autoComplete="new-password"
                            size="small"
                            disabled={!localAuthEnabled}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={4}>
                        <Form.Item {...restField} name={[name, 'is_admin']} valuePropName="checked" label="Admin" style={{ marginBottom: 0 }}>
                          <Switch checkedChildren="Admin" unCheckedChildren="User" size="small" disabled={!localAuthEnabled} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={12} md={4}>
                        <Form.Item label=" " colon={false} style={{ marginBottom: 0 }}>
                          <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(name)} disabled={!localAuthEnabled}>
                            Remove
                          </Button>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Space>
                </Card>
              )})}
              {!addInLabelRow && (
                <Form.Item style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      type="default"
                      icon={<PlusOutlined />}
                      onClick={() => add({ username: '', password: '', is_admin: false })}
                      disabled={!localAuthEnabled}
                    >
                      Add user
                    </Button>
                  </div>
                </Form.Item>
              )}
            </>
          )}
        </Form.List>
      </Form.Item>
    )
  }

  const isBytes = field.kind === 'bytes'
  return (
    <Form.Item
      name={namePath}
      label={field.label}
      extra={field.extra}
      style={{ marginBottom: 12 }}
      rules={
        isBytes
          ? [
              {
                validator: (_, value) => {
                  if (!value || typeof value !== 'string') return Promise.resolve()
                  const bytes = humanToBytes(value)
                  if (bytes === null || bytes <= 0) {
                    return Promise.reject(new Error('Enter a valid size (e.g. 100 MB, 1 GB)'))
                  }
                  return Promise.resolve()
                },
              },
            ]
          : undefined
      }
    >
      <Input
        placeholder={isBytes ? 'e.g. 100 MB, 1 GB' : field.placeholder}
        disabled={!field.editable}
        size="small"
      />
    </Form.Item>
  )
})
