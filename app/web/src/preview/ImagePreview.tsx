import { useState } from 'react'
import { Button, Space, message } from 'antd'
import { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons'
import { theme } from 'antd'
import { getSignedDownloadUrl } from '../api/client'
import { getApiErrorMessage } from '../utils/errors'

const MIN_ZOOM = 0.25
const MAX_ZOOM = 4
const ZOOM_STEP = 0.25

interface Props {
  src: string
  name: string
  path: string
}

export default function ImagePreview({ src, name, path }: Props) {
  const { token } = theme.useToken()
  const [error, setError] = useState(false)
  const [zoom, setZoom] = useState(1)

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))
  const resetZoom = () => setZoom(1)

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault()
    const hide = message.loading('Preparing download...', 0)
    getSignedDownloadUrl(path)
      .then((url) => {
        hide()
        const w = window.open(url, '_blank', 'noopener,noreferrer')
        if (!w) message.warning('Popup blocked. Allow popups to download.')
        else message.success('Download started')
      })
      .catch((err) => {
        hide()
        message.error(getApiErrorMessage(err))
      })
  }

  if (error) {
    return (
      <p style={{ color: token.colorTextTertiary }}>
        Failed to load image.{' '}
        <a href="#" onClick={handleDownload} rel="noreferrer">
          Download
        </a>
      </p>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ flexShrink: 0, padding: 8, display: 'flex', justifyContent: 'center', borderBottom: `1px solid ${token.colorBorder}` }}>
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<ZoomOutOutlined />}
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            title="Zoom out"
          />
          <Button type="text" size="small" onClick={resetZoom} title="Reset zoom">
            {Math.round(zoom * 100)}%
          </Button>
          <Button
            type="text"
            size="small"
            icon={<ZoomInOutlined />}
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            title="Zoom in"
          />
        </Space>
      </div>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <img
          src={src}
          alt={name}
          onError={() => setError(true)}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        />
      </div>
    </div>
  )
}
