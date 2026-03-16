import { Button, Input, Popconfirm, message } from 'antd'
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CopyOutlined,
  SwapOutlined,
  DownloadOutlined,
  LinkOutlined,
  SnippetsOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CloseOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from '@ant-design/icons'
import { theme } from 'antd'
import type { Entry } from '../../types'
import { getFileIcon, formatSize, formatDate } from '../../utils/fileUtils'
import { isInTrash } from '../../utils/pathUtils'
import { getPreviewCategory } from '../../preview'
import { getSignedPreviewUrl } from '../../api/client'
import { getApiErrorMessage } from '../../utils/errors'
import PreviewContent from './PreviewContent'

interface PreviewPanelProps {
  entry: Entry
  hasPrevFile: boolean
  hasNextFile: boolean
  copyableContent: string | null
  previewSearchQuery: string
  onPreviewSearchChange: (value: string) => void
  onCopyableContent: (content: string | null) => void
  onPrevFile: () => void
  onNextFile: () => void
  onCopyClick: () => void
  onMoveClick: () => void
  onDownloadClick: () => void
  onCopyContent: () => void
  onDeleteClick: () => void
  onClose: () => void
  previewFullscreen: boolean
  onFullscreenToggle: () => void
  bulkDownloading: boolean
}

export default function PreviewPanel({
  entry,
  hasPrevFile,
  hasNextFile,
  copyableContent,
  previewSearchQuery,
  onPreviewSearchChange,
  onCopyableContent,
  onPrevFile,
  onNextFile,
  onCopyClick,
  onMoveClick,
  onDownloadClick,
  onCopyContent,
  onDeleteClick,
  onClose,
  previewFullscreen,
  onFullscreenToggle,
  bulkDownloading,
}: PreviewPanelProps) {
  const { token } = theme.useToken()
  const showSearch = ['markdown', 'json', 'csv', 'html', 'text'].includes(getPreviewCategory(entry.name))
  const showFullscreen = ['image', 'video'].includes(getPreviewCategory(entry.name))

  return (
    <div
      style={{
        background: token.colorBgContainer,
        padding: 16,
        borderRadius: 8,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingBottom: 12,
          marginBottom: 12,
          borderBottom: `1px solid ${token.colorBorder}`,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 18, flexShrink: 0 }}>{getFileIcon(entry.name, token)}</span>
        <span
          style={{
            flex: 1,
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}
        >
          {entry.name}
        </span>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onPrevFile} disabled={!hasPrevFile} title="Previous file" />
        <Button type="text" icon={<ArrowRightOutlined />} onClick={onNextFile} disabled={!hasNextFile} title="Next file" />
        <Button icon={<CopyOutlined />} size="small" onClick={onCopyClick} title="Copy this file">
          Copy
        </Button>
        <Button icon={<SwapOutlined />} size="small" onClick={onMoveClick} title="Move this file">
          Move
        </Button>
        <Button
          icon={<DownloadOutlined />}
          size="small"
          onClick={onDownloadClick}
          loading={bulkDownloading}
          title="Download this file"
        >
          Download
        </Button>
        <Button
          type="text"
          icon={<LinkOutlined />}
          size="small"
          onClick={() => {
            getSignedPreviewUrl(entry.path, true)
              .then((url) => {
                const w = window.open(url, '_blank', 'noopener,noreferrer')
                if (!w) message.warning('Popup blocked. Allow popups to open in new tab.')
              })
              .catch((err) => message.error(getApiErrorMessage(err)))
          }}
          title="Open in new tab"
        />
        {copyableContent != null && (
          <Button icon={<SnippetsOutlined />} size="small" onClick={onCopyContent} title="Copy content to clipboard">
            Copy content
          </Button>
        )}
        {showFullscreen && (
          <Button
            type="text"
            icon={previewFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            size="small"
            onClick={onFullscreenToggle}
            title={previewFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          />
        )}
        <Popconfirm
          title={isInTrash(entry.path) ? 'Permanently delete from trash?' : 'Delete this file?'}
          description={isInTrash(entry.path) ? 'This cannot be undone.' : `Delete ${entry.name}?`}
          onConfirm={onDeleteClick}
          okText="Delete"
          okButtonProps={{ danger: true }}
        >
          <Button danger icon={<DeleteOutlined />} size="small" title="Delete this file">
            Delete
          </Button>
        </Popconfirm>
        <Popconfirm
          title="File info"
          description={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 220 }}>
              <div><strong>Name:</strong> {entry.name}</div>
              <div><strong>Path:</strong> <span style={{ wordBreak: 'break-all' }}>{entry.path || 'Home'}</span></div>
              <div><strong>Size:</strong> {entry.isDir ? '—' : formatSize(entry.size ?? 0)}</div>
              <div><strong>Modified:</strong> {formatDate(entry.modified)}</div>
              <div><strong>Type:</strong> {entry.isDir ? 'Folder' : 'File'}</div>
            </div>
          }
          okText="Close"
          cancelButtonProps={{ style: { display: 'none' } }}
          onConfirm={() => {}}
        >
          <Button icon={<InfoCircleOutlined />} size="small" title="Show file info">
            Info
          </Button>
        </Popconfirm>
        <Button type="text" icon={<CloseOutlined />} onClick={onClose} title="Close preview" />
      </div>
      {showSearch && (
        <div style={{ flexShrink: 0, marginBottom: 8 }}>
          <Input.Search
            placeholder="Search in file..."
            value={previewSearchQuery}
            onChange={(e) => onPreviewSearchChange(e.target.value)}
            allowClear
            size="small"
            style={{ maxWidth: 240 }}
          />
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <PreviewContent entry={entry} onCopyableContent={onCopyableContent} searchQuery={previewSearchQuery} />
      </div>
    </div>
  )
}
