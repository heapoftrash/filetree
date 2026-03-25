import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Layout, Button, Input } from 'antd'
import { FolderOpenOutlined } from '@ant-design/icons'
import { theme } from 'antd'
import type { Entry } from '../types'
import { getPreviewCategory } from '../preview'
import AppHeader from './AppHeader'
import PreviewContent from './FileManager/PreviewContent'

function getBasename(path: string): string {
  return path.includes('/') ? path.slice(path.lastIndexOf('/') + 1) : path
}

function getParentPath(path: string): string {
  return path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''
}

export default function StandalonePreview() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const pathParam = searchParams.get('path')

  const [entry, setEntry] = useState<Entry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!pathParam || pathParam.trim() === '') {
      navigate('/files', { replace: true })
      return
    }
    const path = pathParam.trim()
    setEntry({
      path,
      name: getBasename(path),
      isDir: false,
      size: 0,
      modified: '',
    })
  }, [pathParam, navigate])

  if (!entry) {
    return null
  }

  const parentPath = getParentPath(entry.path)
  const fileManagerUrl = `/files${parentPath ? `/${parentPath}` : ''}`
  const showSearch = ['markdown', 'json', 'csv', 'html', 'text'].includes(getPreviewCategory(entry.name))

  return (
    <Layout style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <AppHeader />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 24px',
          background: token.colorBgLayout,
          borderBottom: `1px solid ${token.colorBorder}`,
          flexWrap: 'wrap',
          flexShrink: 0,
        }}
      >
        <Button
          type="text"
          icon={<FolderOpenOutlined />}
          onClick={() => navigate(fileManagerUrl)}
          style={{ color: token.colorText, flexShrink: 0 }}
        >
          Open in file manager
        </Button>
        <span style={{ color: token.colorTextSecondary, fontSize: 14, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</span>
        {showSearch && (
          <Input.Search
            placeholder="Search in file..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            size="small"
            style={{ width: 200, flexShrink: 0 }}
          />
        )}
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          padding: 24,
          background: token.colorBgLayout,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 24,
            background: token.colorBgContainer,
            padding: 16,
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <PreviewContent entry={entry} searchQuery={searchQuery} />
          </div>
        </div>
      </div>
    </Layout>
  )
}
