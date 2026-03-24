import { Spin } from 'antd'
import { theme } from 'antd'
import type { Entry } from '../../types'
import FileListTable from './FileListTable'
import FileListGrid from './FileListGrid'

interface FileListProps {
  entries: Entry[]
  loading: boolean
  viewMode: 'list' | 'grid'
  sortField?: string
  sortOrder: 'ascend' | 'descend' | null
  onSortChange: (field: string | undefined, order: 'ascend' | 'descend' | null) => void
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  previewPath: string | null
  searchQuery: string
  onNavigate: (path: string) => void
  onOpenPreview: (record: Entry) => void
  onRename: (record: Entry) => void
  onDelete: (path: string) => void
  onRestore?: (path: string) => void
  onDragStart: (e: React.DragEvent, record: Entry) => void
  listParentPath: string
}

export default function FileList({
  entries,
  loading,
  viewMode,
  sortField,
  sortOrder,
  onSortChange,
  selectedRowKeys,
  onSelectionChange,
  previewPath,
  searchQuery,
  onNavigate,
  onOpenPreview,
  onRename,
  onDelete,
  onRestore,
  onDragStart,
  listParentPath,
}: FileListProps) {
  const { token } = theme.useToken()

  return (
    <Spin spinning={loading}>
      {viewMode === 'list' ? (
        <FileListTable
          entries={entries}
          loading={false}
          sortField={sortField}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={onSelectionChange}
          previewPath={previewPath}
          searchQuery={searchQuery}
          token={token}
          onNavigate={onNavigate}
          onOpenPreview={onOpenPreview}
          onRename={onRename}
          onDelete={onDelete}
          onRestore={onRestore}
          listParentPath={listParentPath}
        />
      ) : (
        <FileListGrid
          entries={entries}
          searchQuery={searchQuery}
          selectedRowKeys={selectedRowKeys}
          previewPath={previewPath}
          token={token}
          listParentPath={listParentPath}
          onNavigate={onNavigate}
          onOpenPreview={onOpenPreview}
          onSelectionChange={onSelectionChange}
          onDragStart={onDragStart}
        />
      )}
    </Spin>
  )
}
