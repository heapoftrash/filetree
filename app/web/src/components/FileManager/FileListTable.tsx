import { Table, Button, Space, Popconfirm, Empty, message } from 'antd'
import { FolderOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, UndoOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Entry } from '../../types'
import { getFileIcon, formatSize, formatDate } from '../../utils/fileUtils'
import { isInTrash, isRestorableTrashPath, listDisplayName, listNameSortKey } from '../../utils/pathUtils'
import { getSignedDownloadUrl } from '../../api/client'
import { getApiErrorMessage } from '../../utils/errors'
import type { GlobalToken } from 'antd/es/theme'

interface FileListTableProps {
  entries: Entry[]
  loading: boolean
  sortField?: string
  sortOrder: 'ascend' | 'descend' | null
  onSortChange: (field: string | undefined, order: 'ascend' | 'descend' | null) => void
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  previewPath: string | null
  searchQuery: string
  token: GlobalToken
  onNavigate: (path: string) => void
  onOpenPreview: (record: Entry) => void
  onRename: (record: Entry) => void
  onDelete: (path: string) => void
  onRestore?: (path: string) => void
  listParentPath: string
}

export default function FileListTable({
  entries,
  loading,
  sortField,
  sortOrder,
  onSortChange,
  selectedRowKeys,
  onSelectionChange,
  previewPath,
  searchQuery,
  token,
  onNavigate,
  onOpenPreview,
  onRename,
  onDelete,
  onRestore,
  listParentPath,
}: FileListTableProps) {
  const columns: ColumnsType<Entry> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sortOrder: sortField === 'name' ? sortOrder : undefined,
      sorter: (a: Entry, b: Entry) =>
        listNameSortKey(a, listParentPath).localeCompare(listNameSortKey(b, listParentPath)),
      render: (_name: string, record: Entry) => {
        const label = listDisplayName(record, listParentPath)
        return (
          <Space>
            {record.isDir ? (
              <FolderOutlined style={{ color: token.colorWarning }} />
            ) : (
              getFileIcon(record.name, token)
            )}
            {record.isDir ? (
              <a
                href="#"
                title={record.name !== label ? record.name : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate(`/files/${record.path}`)
                }}
              >
                {label}
              </a>
            ) : (
              <>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    onOpenPreview(record)
                  }}
                >
                  {label}
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    const hide = message.loading('Preparing download...', 0)
                    getSignedDownloadUrl(record.path)
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
                  }}
                  style={{ marginLeft: 4 }}
                  rel="noreferrer"
                >
                  <DownloadOutlined title="Download" />
                </a>
              </>
            )}
          </Space>
        )
      },
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      sortOrder: sortField === 'size' ? sortOrder : undefined,
      sorter: (a: Entry, b: Entry) => (a.size ?? 0) - (b.size ?? 0),
      render: (_: unknown, record: Entry) => (record.isDir ? '—' : formatSize(record.size ?? 0)),
    },
    {
      title: 'Modified',
      dataIndex: 'modified',
      key: 'modified',
      width: 180,
      sortOrder: sortField === 'modified' ? sortOrder : undefined,
      sorter: (a: Entry, b: Entry) =>
        new Date(a.modified).getTime() - new Date(b.modified).getTime(),
      render: (modified: string) => formatDate(modified),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: unknown, record: Entry) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onRename(record)} title="Rename" />
          {onRestore && isRestorableTrashPath(record.path) && (
            <Button
              type="link"
              size="small"
              icon={<UndoOutlined />}
              onClick={() => onRestore(record.path)}
              title="Restore to original location"
            />
          )}
          <Popconfirm
            title={isInTrash(record.path) ? 'Permanently delete from trash?' : 'Delete?'}
            description={
              isInTrash(record.path)
                ? 'This cannot be undone.'
                : `Delete ${record.name}?`
            }
            onConfirm={() => onDelete(record.path)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} title="Delete" />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectionChange,
  }

  return (
    <Table
      rowKey="path"
      columns={columns}
      dataSource={entries}
      rowSelection={rowSelection}
      rowClassName={(record) => (previewPath === record.path ? 'preview-active-row' : '')}
      pagination={false}
      size="small"
      loading={loading}
      onChange={(_p, _f, sorter, extra) => {
        if (extra?.action !== 'sort') return
        const o = Array.isArray(sorter) ? sorter[0] : sorter
        const field = o?.columnKey as string | undefined
        const order = (o?.order as 'ascend' | 'descend') || null
        onSortChange(field, order)
      }}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={searchQuery ? 'No matching files' : 'This folder is empty'}
          />
        ),
      }}
      onRow={(record) =>
        record.isDir
          ? {
              'data-drop-path': record.path,
              onDoubleClick: () => onNavigate(`/files/${record.path}`),
              draggable: true,
              onDragStart: (e) => {
                const action = e.ctrlKey || e.metaKey ? 'copy' : 'move'
                e.dataTransfer.setData('application/json', JSON.stringify({ paths: [record.path], action }))
                e.dataTransfer.effectAllowed = 'copyMove'
              },
            }
          : {
              draggable: true,
              onDragStart: (e) => {
                const action = e.ctrlKey || e.metaKey ? 'copy' : 'move'
                e.dataTransfer.setData('application/json', JSON.stringify({ paths: [record.path], action }))
                e.dataTransfer.effectAllowed = 'copyMove'
              },
            }
      }
    />
  )
}
