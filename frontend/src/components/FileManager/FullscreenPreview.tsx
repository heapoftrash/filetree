import { useState, useEffect, useCallback } from 'react'
import { Button, Spin, message } from 'antd'
import { FullscreenExitOutlined, ReloadOutlined } from '@ant-design/icons'
import { getSignedPreviewUrl } from '../../api/client'
import { getPreviewCategory } from '../../preview'
import { getApiErrorMessage } from '../../utils/errors'
import type { Entry } from '../../types'

interface FullscreenPreviewProps {
  entry: Entry
  onClose: () => void
}

export default function FullscreenPreview({ entry, onClose }: FullscreenPreviewProps) {
  const [url, setUrl] = useState<string | null>(null)

  const loadUrl = useCallback(() => {
    setUrl(null)
    getSignedPreviewUrl(entry.path, true)
      .then(setUrl)
      .catch((err) => {
        message.error(getApiErrorMessage(err))
        setUrl('')
      })
  }, [entry.path])

  useEffect(() => {
    loadUrl()
  }, [loadUrl])

  const isImage = getPreviewCategory(entry.name) === 'image'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <Button
        type="text"
        icon={<FullscreenExitOutlined />}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: 'white',
          zIndex: 2001,
        }}
        onClick={onClose}
        title="Exit fullscreen"
      />
      {url === null ? (
        <Spin size="large" tip="Loading..." />
      ) : url === '' ? (
        <div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
          onClick={(e) => e.stopPropagation()}
        >
          <p style={{ color: 'white' }}>Failed to load</p>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={loadUrl}
            style={{ background: 'white', color: '#000' }}
          >
            Retry
          </Button>
        </div>
      ) : isImage ? (
        <img
          src={url}
          alt={entry.name}
          style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain' }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <video
          src={url}
          controls
          autoPlay
          style={{ maxWidth: '95vw', maxHeight: '95vh' }}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  )
}
