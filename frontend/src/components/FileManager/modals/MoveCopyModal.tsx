import { Modal, Tree } from 'antd'
import { HomeOutlined } from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import { theme } from 'antd'

interface MoveCopyModalProps {
  open: boolean
  type: 'move' | 'copy'
  onOk: () => void
  onCancel: () => void
  treeData: DataNode[]
  onTreeLoadData: (node: DataNode) => Promise<void>
  dest: string
  onDestChange: (path: string) => void
  currentPath: string
  loading?: boolean
}

export default function MoveCopyModal({
  open,
  type,
  onOk,
  onCancel,
  treeData,
  onTreeLoadData,
  dest,
  onDestChange,
  currentPath,
  loading = false,
}: MoveCopyModalProps) {
  const { token } = theme.useToken()
  return (
    <Modal
      title={type === 'move' ? 'Move to folder' : 'Copy to folder'}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText={type === 'move' ? 'Move' : 'Copy'}
      confirmLoading={loading}
    >
      <p style={{ marginBottom: 8 }}>Select destination folder:</p>
      <Tree
        showIcon
        blockNode
        treeData={[
          {
            key: '',
            title: 'Home',
            icon: <HomeOutlined />,
            isLeaf: treeData.length === 0,
            children: treeData.length ? treeData : undefined,
          },
        ]}
        loadData={(node) => {
          if ((node.key as string) === '') return Promise.resolve()
          return onTreeLoadData(node)
        }}
        onSelect={(keys) => onDestChange((keys[0] as string) ?? '')}
        selectedKeys={dest !== undefined ? [dest] : []}
      />
      <p style={{ marginTop: 8, color: token.colorTextSecondary }}>
        Destination: {dest === '' ? 'Home' : dest || '(none)'}
        {dest === currentPath && ' (current folder)'}
      </p>
    </Modal>
  )
}
