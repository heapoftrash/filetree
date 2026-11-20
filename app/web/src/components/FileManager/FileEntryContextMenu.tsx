import { Dropdown, Modal } from 'antd'
import type { MenuProps } from 'antd'
import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FolderOpenOutlined,
  LinkOutlined,
  SnippetsOutlined,
  SwapOutlined,
  UndoOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import type { Entry } from '../../types'
import { isInTrash, isRestorableTrashPath } from '../../utils/pathUtils'

export interface FileEntryContextActions {
  onOpen: (record: Entry) => void
  onRename: (record: Entry) => void
  onDelete: (path: string) => void
  onRestore?: (path: string) => void
  onCopySignedLink?: (path: string) => void
  onCopyPath?: (path: string) => void
  onDownload?: (path: string) => void
  onStartCopy?: (record: Entry) => void
  onStartMove?: (record: Entry) => void
}

interface FileEntryContextMenuProps extends FileEntryContextActions {
  record: Entry
  children: React.ReactElement
}

export default function FileEntryContextMenu({
  record,
  children,
  onOpen,
  onRename,
  onDelete,
  onRestore,
  onCopySignedLink,
  onCopyPath,
  onDownload,
  onStartCopy,
  onStartMove,
}: FileEntryContextMenuProps) {
  const items: MenuProps['items'] = [
    {
      key: 'open',
      icon: record.isDir ? <FolderOpenOutlined /> : <EyeOutlined />,
      label: record.isDir ? 'Open' : 'Preview',
      onClick: () => onOpen(record),
    },
    ...(!record.isDir && onDownload
      ? [
          {
            key: 'download',
            icon: <DownloadOutlined />,
            label: 'Download',
            onClick: () => onDownload(record.path),
          },
        ]
      : []),
    ...(!record.isDir && onCopySignedLink
      ? [
          {
            key: 'copy-link',
            icon: <LinkOutlined />,
            label: 'Copy link',
            onClick: () => onCopySignedLink(record.path),
          },
        ]
      : []),
    ...(onCopyPath
      ? [
          {
            key: 'copy-path',
            icon: <SnippetsOutlined />,
            label: 'Copy path',
            onClick: () => onCopyPath(record.path),
          },
        ]
      : []),
    { type: 'divider' },
    {
      key: 'rename',
      icon: <EditOutlined />,
      label: 'Rename',
      onClick: () => onRename(record),
    },
    ...(onStartCopy
      ? [
          {
            key: 'copy',
            icon: <CopyOutlined />,
            label: 'Copy to…',
            onClick: () => onStartCopy(record),
          },
        ]
      : []),
    ...(onStartMove
      ? [
          {
            key: 'move',
            icon: <SwapOutlined />,
            label: 'Move to…',
            onClick: () => onStartMove(record),
          },
        ]
      : []),
    ...(onRestore && isRestorableTrashPath(record.path)
      ? [
          {
            key: 'restore',
            icon: <UndoOutlined />,
            label: 'Restore',
            onClick: () => onRestore(record.path),
          },
        ]
      : []),
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      danger: true,
      label: isInTrash(record.path) ? 'Delete permanently' : 'Delete',
      onClick: () => {
        Modal.confirm({
          title: isInTrash(record.path) ? 'Permanently delete from trash?' : 'Delete?',
          content: isInTrash(record.path)
            ? 'This cannot be undone.'
            : `Delete ${record.name}?`,
          okText: 'Delete',
          okButtonProps: { danger: true },
          onOk: () => onDelete(record.path),
        })
      },
    },
  ]

  return (
    <Dropdown menu={{ items }} trigger={['contextMenu']}>
      {children}
    </Dropdown>
  )
}
