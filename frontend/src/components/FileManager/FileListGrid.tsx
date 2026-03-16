import { Card, Empty } from 'antd'
import { FolderOutlined } from '@ant-design/icons'
import type { Entry } from '../../types'
import { getFileIcon, formatSize } from '../../utils/fileUtils'
import type { GlobalToken } from 'antd/es/theme'

interface FileListGridProps {
  entries: Entry[]
  searchQuery: string
  selectedRowKeys: React.Key[]
  previewPath: string | null
  token: GlobalToken
  onNavigate: (path: string) => void
  onOpenPreview: (record: Entry) => void
  onSelectionChange: (keys: React.Key[]) => void
  onDragStart: (e: React.DragEvent, record: Entry) => void
}

export default function FileListGrid({
  entries,
  searchQuery,
  selectedRowKeys,
  previewPath,
  token,
  onNavigate,
  onOpenPreview,
  onSelectionChange,
  onDragStart,
}: FileListGridProps) {
  if (entries.length === 0) {
    return (
      <div style={{ width: '100%' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={searchQuery ? 'No matching files' : 'This folder is empty'}
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      {entries.map((record) => (
        <Card
          key={record.path}
          size="small"
          hoverable
          draggable
          {...(record.isDir ? { 'data-drop-path': record.path } : {})}
          style={{
            flex: '1 1 140px',
            minWidth: 140,
            maxWidth: 220,
            cursor: 'pointer',
            textAlign: 'center',
            ...(selectedRowKeys.includes(record.path) || previewPath === record.path
              ? { borderColor: token.colorPrimary, borderWidth: 2, backgroundColor: token.colorPrimaryBg }
              : {}),
          }}
          onDragStart={(e) => onDragStart(e, record)}
          onClick={(e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault()
              onSelectionChange(
                selectedRowKeys.includes(record.path)
                  ? selectedRowKeys.filter((k) => k !== record.path)
                  : [...selectedRowKeys, record.path]
              )
            } else {
              if (record.isDir) onNavigate(`/files/${record.path}`)
              else onOpenPreview(record)
            }
          }}
          onDoubleClick={() => record.isDir && onNavigate(`/files/${record.path}`)}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>
            {record.isDir ? (
              <FolderOutlined style={{ color: token.colorWarning }} />
            ) : (
              getFileIcon(record.name, token)
            )}
          </div>
          <div
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: 12,
            }}
          >
            {record.name}
          </div>
          {!record.isDir && (
            <div style={{ fontSize: 11, color: token.colorTextTertiary, marginTop: 4 }}>
              {formatSize(record.size ?? 0)}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
