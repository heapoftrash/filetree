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
  Alert,
  Divider,
  Modal,
  Tooltip,
} from 'antd'
import {
  CloudServerOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
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

const ExtraWithIcon = ({ children }: { children: React.ReactNode }) => {
  const { token } = theme.useToken()
  if (!children) return null
  return (
    <Space size={4} style={{ display: 'inline-flex' }}>
      <InfoCircleOutlined style={{ color: token.colorPrimary, fontSize: 12 }} />
      <span>{children}</span>
    </Space>
  )
}

/** Ant Design Form.Item: show long hints next to the label (hover) instead of an extra line. */
function formItemTooltip(text?: string | null): { title: string; icon: React.ReactElement } | undefined {
  const t = text?.trim()
  if (!t) return undefined
  return { title: t, icon: <InfoCircleOutlined /> }
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
  { key: 'admin_user', label: 'OAuth', icon: <UserOutlined /> },
  { key: 'local_user', label: 'Local', icon: <TeamOutlined /> },
] as const

const SECTION_OPTIONS = TOP_LEVEL_SECTIONS.map((s) => ({
  label: s.label,
  value: s.id,
  icon: SECTION_ICONS[s.id],
}))

/** Settings form: label left, control right; stacks on narrow viewports. */
const SETTINGS_FORM_LAYOUT = {
  labelCol: { xs: 24, sm: 9, md: 8, lg: 7 },
  wrapperCol: { xs: 24, sm: 15, md: 16, lg: 17 },
}

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
      } else if (field?.kind === 'string[]' && (key === 'oauth_admin_emails' || key === 'oauth_allowed_emails')) {
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
    if (key === 'oauth_admin_emails' || key === 'oauth_allowed_emails' || key === 'oauth_allow_all_users') {
      return { section: 'users', usersSub: 'admin_user' }
    }
    if (key === 'default_admin_username' || key === 'default_admin_password') {
      return { section: 'users', usersSub: 'local_user' }
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
  const oauthAdminEmailsWatch = Form.useWatch(['users', 'oauth_admin_emails'], form)
  const oauthAllowedEmailsWatch = Form.useWatch(['users', 'oauth_allowed_emails'], form)
  const oauthAllowAllUsersWatch = Form.useWatch(['users', 'oauth_allow_all_users'], form)
  const oauthEnabled =
    (authProviders && typeof authProviders === 'object' &&
      ((authProviders as Record<string, Record<string, unknown>>).google?.enabled === true ||
        (authProviders as Record<string, Record<string, unknown>>).github?.enabled === true)) ??
    false

  const oauthSignInOk = useMemo(() => {
    if (oauthAllowAllUsersWatch === true) return true
    const countNonEmpty = (arr: unknown) =>
      Array.isArray(arr) ? (arr as unknown[]).filter((e) => typeof e === 'string' && e.trim()).length : 0
    return countNonEmpty(oauthAdminEmailsWatch) + countNonEmpty(oauthAllowedEmailsWatch) > 0
  }, [oauthAllowAllUsersWatch, oauthAdminEmailsWatch, oauthAllowedEmailsWatch])

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

  const oauthAdminUserFields = useMemo(() => {
    const users = fieldsBySection.users ?? []
    const order = ['oauth_admin_emails', 'oauth_allowed_emails', 'oauth_allow_all_users']
    return users
      .filter((f) => order.includes(f.key))
      .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
  }, [fieldsBySection.users])

  const defaultAdminBootstrapFields = useMemo(() => {
    const users = fieldsBySection.users ?? []
    const order = ['default_admin_username', 'default_admin_password']
    return users
      .filter((f) => order.includes(f.key))
      .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
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
      <Content style={{ padding: 24, maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        <Title level={3} style={{ marginBottom: 12 }}>
          Settings
        </Title>
        <Card>
          <Segmented
            value={activeSection}
            onChange={(v) => setActiveSection(v as string)}
            options={SECTION_OPTIONS}
            block
            size="middle"
            style={{ marginBottom: 16 }}
          />
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            <ExtraWithIcon>Changes may require a server restart to take effect.</ExtraWithIcon>
          </Text>
          <Form
            form={form}
            layout="horizontal"
            {...SETTINGS_FORM_LAYOUT}
            labelAlign="left"
            colon={false}
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
                      {oauthEnabled && !oauthSignInOk && (
                        <Alert
                          type="warning"
                          showIcon
                          style={{ marginBottom: 16 }}
                          message="OAuth sign-in is turned off for everyone"
                          description="Add at least one email under Admins or Additional sign-ins, or enable Allow all OAuth users. Otherwise OAuth logins are rejected."
                        />
                      )}
                      <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
                        OAuth sign-in
                      </Title>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                        Who may use Google or GitHub to sign in. If both lists are empty and allow-all is off, OAuth login is blocked.
                      </Text>
                      {oauthAdminUserFields.map((field) => (
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
                      {oauthAllowAllUsersWatch === true && (
                        <Alert
                          type="warning"
                          showIcon
                          style={{ marginBottom: 16 }}
                          message="Open OAuth sign-in enabled"
                          description="Any OAuth user with an email can sign in. Email lists are ignored for sign-in; only the admin list controls who gets admin access."
                        />
                      )}
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
                      <Divider style={{ margin: '20px 0' }} />
                      <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
                        Default admin (bootstrap)
                      </Title>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                        Used when no local users exist yet. Password is stored hashed in config after first startup.
                      </Text>
                      {defaultAdminBootstrapFields.map((field) => (
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

/** Switch for oauth_allow_all_users: confirm before enabling open sign-in. */
function OAuthAllowAllSwitch({ checked, onChange }: { checked?: boolean; onChange?: (checked: boolean) => void }) {
  return (
    <Switch
      checked={!!checked}
      checkedChildren="On"
      unCheckedChildren="Off"
      size="small"
      onChange={(checked) => {
        if (checked) {
          Modal.confirm({
            title: 'Allow any OAuth user to sign in?',
            content:
              'Email lists will not restrict who can sign in with OAuth. Admin access still follows the admin list only. Use only in trusted environments.',
            okText: 'Enable',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: () => onChange?.(true),
          })
        } else {
          onChange?.(false)
        }
      }}
    />
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
        tooltip={formItemTooltip(clientSecretSet ? 'Value is set. Cannot be changed after save.' : 'Enter client secret to save.')}
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
      <Form.Item label={field.label} tooltip={formItemTooltip(isSet ? 'Value is set.' : 'Not set.')} style={{ marginBottom: 12 }}>
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
    <Form.Item name={namePath} label={field.label} tooltip={formItemTooltip(field.extra)} style={{ marginBottom: 12 }}>
      <Input placeholder={field.placeholder} disabled={!field.editable} size="small" />
    </Form.Item>
  )
})

/** Single card: title + Add user in header; each row is username, password, admin (horizontal). */
const LocalUsersListField = React.memo(function LocalUsersListField({
  namePath,
  initialList,
  listForPasswordFlag,
  localUsersFormValues,
  localAuthEnabled,
  label,
  tooltip,
}: {
  namePath: (string | number)[]
  initialList: Array<{ username: string; password: string; is_admin: boolean; password_set?: boolean }>
  listForPasswordFlag: Array<Record<string, unknown>>
  localUsersFormValues: Array<Record<string, unknown>>
  localAuthEnabled: boolean
  label: string
  tooltip: ReturnType<typeof formItemTooltip>
}) {
  /** Reserve enough label width so horizontal labels don’t collide with middle-sized inputs. */
  const cellLayout = {
    labelCol: { flex: '0 0 112px', style: { overflow: 'visible' as const } },
    wrapperCol: { flex: '1 1 0', minWidth: 0, style: { minWidth: 0 } },
  }
  const adminLayout = {
    labelCol: { flex: '0 0 52px', style: { overflow: 'visible' as const } },
    wrapperCol: { flex: '0 0 auto' },
  }

  const cardTitle = (
    <Space size={6}>
      <span>{label}</span>
      {tooltip ? (
        <Tooltip title={tooltip.title}>
          <span style={{ cursor: 'help', display: 'inline-flex', alignItems: 'center' }}>{tooltip.icon}</span>
        </Tooltip>
      ) : null}
    </Space>
  )

  return (
    <Form.Item noStyle>
      <div style={{ width: '100%', minWidth: 0, marginBottom: 12 }}>
        <Form.List name={namePath} initialValue={initialList}>
          {(fields, { add, remove }) => (
            <Card
              title={cardTitle}
              extra={
                <Button
                  type="default"
                  icon={<PlusOutlined />}
                  onClick={() => add({ username: '', password: '', is_admin: false })}
                  disabled={!localAuthEnabled}
                >
                  Add user
                </Button>
              }
              styles={{ body: { paddingBlock: 16 } }}
            >
              {fields.map(({ key, name, ...restField }, index) => {
                const item = listForPasswordFlag[name] ?? localUsersFormValues?.[name] ?? {}
                const passwordSet = !!item?.password_set
                return (
                  <Row
                    key={key}
                    gutter={[12, 12]}
                    wrap
                    align="middle"
                    style={{ marginBottom: index < fields.length - 1 ? 12 : 0 }}
                  >
                    <Col xs={24} md={12} lg={11} flex="1 1 200px" style={{ minWidth: 0 }}>
                      <Form.Item
                        {...restField}
                        {...cellLayout}
                        layout="horizontal"
                        name={[name, 'username']}
                        label="Username"
                        rules={[{ required: true }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input
                          placeholder="Username"
                          size="middle"
                          disabled={!localAuthEnabled || passwordSet}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12} lg={11} flex="1 1 200px" style={{ minWidth: 0 }}>
                      <Form.Item
                        {...restField}
                        {...cellLayout}
                        layout="horizontal"
                        name={[name, 'password']}
                        label="Password"
                        rules={!passwordSet ? [{ required: true, message: 'Password is required for new users' }] : undefined}
                        tooltip={passwordSet ? formItemTooltip('Value is set. Enter a new value to change it.') : undefined}
                        style={{ marginBottom: 0 }}
                      >
                        <Input.Password
                          placeholder={passwordSet ? '••••••••' : undefined}
                          autoComplete="new-password"
                          size="middle"
                          disabled={!localAuthEnabled}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col flex="none" style={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                      <Form.Item
                        {...restField}
                        {...adminLayout}
                        layout="horizontal"
                        name={[name, 'is_admin']}
                        valuePropName="checked"
                        label="Admin"
                        style={{ marginBottom: 0 }}
                      >
                        <Switch size="small" disabled={!localAuthEnabled} />
                      </Form.Item>
                    </Col>
                    <Col flex="none" style={{ width: 32, minWidth: 32, textAlign: 'center' }}>
                      <Tooltip title="Remove user">
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                          disabled={!localAuthEnabled}
                          aria-label="Remove user"
                        />
                      </Tooltip>
                    </Col>
                  </Row>
                )
              })}
            </Card>
          )}
        </Form.List>
      </div>
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
  const sectionValues = values[sectionId] ?? {}
  const rawValue = sectionValues[field.key]

  if (field.secret && !field.editable) {
    const isSet = !!rawValue
    return (
      <Form.Item label={field.label} key={field.key} tooltip={formItemTooltip(isSet ? 'Value is set.' : 'Not set.')} style={{ marginBottom: 12 }}>
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
        tooltip={formItemTooltip(isSet ? 'Value is set. Enter a new value to change it.' : 'Enter password for first-time setup.')}
        style={{ marginBottom: 12 }}
      >
        <Input.Password placeholder={isSet ? '••••••••' : undefined} autoComplete="new-password" size="small" />
      </Form.Item>
    )
  }

  const namePath = [sectionId, field.key]

  if (field.kind === 'bool') {
    if (field.key === 'oauth_allow_all_users') {
      return (
        <Form.Item
          name={namePath}
          label={field.label}
          valuePropName="checked"
          tooltip={formItemTooltip(field.extra)}
          style={{ marginBottom: 12 }}
        >
          <OAuthAllowAllSwitch />
        </Form.Item>
      )
    }
    return (
      <Form.Item name={namePath} label={field.label} valuePropName="checked" style={{ marginBottom: 12 }}>
        <Switch checkedChildren="On" unCheckedChildren="Off" size="small" />
      </Form.Item>
    )
  }

  if (field.kind === 'string[]') {
    const arr = Array.isArray(rawValue) ? rawValue : []
    const list = arr.filter((x): x is string => typeof x === 'string')
    const isOAuthEmailList = field.key === 'oauth_admin_emails' || field.key === 'oauth_allowed_emails'
    const oauthListDisabled = isOAuthEmailList && !oauthEnabled
    const initialList = isOAuthEmailList && list.length === 0 ? [''] : list
    const oauthPlaceholder = field.key === 'oauth_admin_emails' ? 'admin@example.com' : 'user@example.com'
    const labelInRow = addButtonPosition === 'right'
    const oauthListTooltip = oauthListDisabled
      ? 'Enable an OAuth provider (Google or GitHub) to configure OAuth email lists.'
      : field.extra
    return (
      <Form.Item label={field.label} tooltip={formItemTooltip(oauthListTooltip)} style={{ marginBottom: 12 }}>
        <Form.List name={namePath} initialValue={initialList}>
          {(fields, { add, remove }, { errors }) => (
            <>
              {labelInRow && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <Button size="small" type="default" icon={<PlusOutlined />} onClick={() => add('')} disabled={oauthListDisabled}>
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
                    style={{ marginBottom: 0, minWidth: 240, flex: 1 }}
                  >
                    <Input
                      placeholder={isOAuthEmailList ? oauthPlaceholder : field.placeholder}
                      type={isOAuthEmailList ? 'email' : 'text'}
                      size="small"
                      disabled={oauthListDisabled}
                    />
                  </Form.Item>
                  <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(name)} disabled={oauthListDisabled}>
                    Remove
                  </Button>
                </Space>
              ))}
              {!labelInRow && (
                <Form.Item style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Button size="small" type="default" icon={<PlusOutlined />} onClick={() => add('')} disabled={oauthListDisabled}>
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
      username: typeof u.username === 'string' ? u.username : '',
      password: '',
      is_admin: typeof u.is_admin === 'boolean' ? u.is_admin : false,
      password_set: !!u.password_set,
    }))
    return (
      <LocalUsersListField
        namePath={namePath}
        initialList={list.length ? list : [{ username: '', password: '', is_admin: false }]}
        listForPasswordFlag={list}
        localUsersFormValues={localUsersFormValues}
        localAuthEnabled={localAuthEnabled}
        label={field.label}
        tooltip={formItemTooltip(!localAuthEnabled ? 'Enable "Local users enabled" above to add local users.' : undefined)}
      />
    )
  }

  const isBytes = field.kind === 'bytes'
  return (
    <Form.Item
      name={namePath}
      label={field.label}
      tooltip={formItemTooltip(field.extra)}
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
