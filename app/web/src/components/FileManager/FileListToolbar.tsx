import { Button, Input, Segmented, Space, Popconfirm } from 'antd'
import {
  ArrowLeftOutlined,
  SearchOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  CopyOutlined,
  SwapOutlined,
  DownloadOutlined,
  DeleteOutlined,
  UndoOutlined,
} from '@ant-design/icons'
import FileBreadcrumb from './FileBreadcrumb'
import { isInTrash, isRestorableTrashPath } from '../../utils/pathUtils'

interface FileListToolbarProps {
  currentPath: string
  searchQuery: string
  onSearchChange: (value: string) => void
  viewMode: 'list' | 'grid'
  onViewModeChange: (mode: 'list' | 'grid') => void
  selectedRowKeys: React.Key[]
  onNavigate: (path: string) => void
  onCopyClick: () => void
  onMoveClick: () => void
  onDownloadClick: () => void
  onDeleteClick: () => void
  onRestoreClick: () => void
  bulkDownloading: boolean
}

export default function FileListToolbar({
  currentPath,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  selectedRowKeys,
  onNavigate,
  onCopyClick,
  onMoveClick,
  onDownloadClick,
  onDeleteClick,
  onRestoreClick,
  bulkDownloading,
}: FileListToolbarProps) {
  const goBack = () => {
    const parts = currentPath.split('/').filter(Boolean)
    const parentPath = parts.slice(0, -1).join('/')
    onNavigate(parentPath ? `/files/${parentPath}` : '/files')
  }

  const hasSelection = selectedRowKeys.length > 0
  const anyInTrash = selectedRowKeys.some((k) => isInTrash(k as string))
  const restorableSelected = selectedRowKeys.filter((k) => isRestorableTrashPath(k as string))

  return (
    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={goBack}
        disabled={!currentPath}
        title="Go back"
        style={{ flexShrink: 0 }}
      />
      <FileBreadcrumb currentPath={currentPath} navigate={onNavigate} />
      <div style={{ flex: 1, minWidth: 0 }} />
      <Input
        placeholder="Search in this folder"
        prefix={<SearchOutlined />}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        allowClear
        style={{ maxWidth: 280 }}
      />
      <Segmented
        value={viewMode}
        onChange={(v) => onViewModeChange(v as 'list' | 'grid')}
        options={[
          { label: <><UnorderedListOutlined /> List</>, value: 'list' },
          { label: <><AppstoreOutlined /> Grid</>, value: 'grid' },
        ]}
      />
      {hasSelection && (
        <Space>
          <Button icon={<CopyOutlined />} size="small" onClick={onCopyClick}>
            Copy ({selectedRowKeys.length})
          </Button>
          <Button icon={<SwapOutlined />} size="small" onClick={onMoveClick}>
            Move ({selectedRowKeys.length})
          </Button>
          <Button icon={<DownloadOutlined />} size="small" onClick={onDownloadClick} loading={bulkDownloading}>
            Download ({selectedRowKeys.length})
          </Button>
          {restorableSelected.length > 0 && (
            <Button icon={<UndoOutlined />} size="small" onClick={onRestoreClick}>
              Restore ({restorableSelected.length})
            </Button>
          )}
          <Popconfirm
            title={anyInTrash ? 'Permanently delete from trash?' : 'Delete selected?'}
            description={anyInTrash ? 'This cannot be undone.' : `Delete ${selectedRowKeys.length} item(s)?`}
            onConfirm={onDeleteClick}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              Delete ({selectedRowKeys.length})
            </Button>
          </Popconfirm>
        </Space>
      )}
    </div>
  )
}
