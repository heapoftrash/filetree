import { useEffect, useState } from 'react'
import { Layout, Tag, Tree } from 'antd'
import { HomeOutlined, MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import { theme } from 'antd'

const { Sider } = Layout

function getAllKeys(nodes: DataNode[]): React.Key[] {
  const keys: React.Key[] = []
  for (const n of nodes) {
    if (n.key != null) keys.push(n.key)
    if (n.children?.length) keys.push(...getAllKeys(n.children as DataNode[]))
  }
  return keys
}

interface FileTreeSidebarProps {
  treeData: DataNode[]
  onTreeLoadData: (node: DataNode) => Promise<void>
  onTreeSelect: (keys: React.Key[]) => void
  currentPath: string
  onDrop: (e: React.DragEvent, targetPath: string) => void
}

export default function FileTreeSidebar({
  treeData,
  onTreeLoadData,
  onTreeSelect,
  currentPath,
  onDrop,
}: FileTreeSidebarProps) {
  const { token } = theme.useToken()
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])

  useEffect(() => {
    if (!currentPath) {
      setExpandedKeys([''])
      return
    }
    const parts = currentPath.split('/').filter(Boolean)
    const ancestors: string[] = []
    for (let i = 0; i < parts.length; i++) {
      ancestors.push(parts.slice(0, i + 1).join('/'))
    }
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      next.add('')
      ancestors.forEach((a) => next.add(a))
      return Array.from(next)
    })
  }, [currentPath])

  const wrapWithDropTarget = (key: string, title: React.ReactNode) => (
    <span data-drop-path={key}>{title}</span>
  )

  const wrapTreeData = (nodes: DataNode[]): DataNode[] =>
    nodes.map((n) => ({
      ...n,
      title: wrapWithDropTarget(String(n.key ?? ''), n.title as React.ReactNode),
      children: n.children ? wrapTreeData(n.children as DataNode[]) : undefined,
    }))

  const treeWithHome: DataNode[] = [
    {
      key: '',
      title: wrapWithDropTarget('', 'Home'),
      icon: <HomeOutlined />,
      isLeaf: treeData.length === 0,
      children: treeData.length ? wrapTreeData(treeData) : undefined,
    },
  ]

  const handleExpandAll = () => setExpandedKeys(getAllKeys(treeWithHome))
  const handleCollapseAll = () => setExpandedKeys([])

  return (
    <Sider width={220} style={{ background: token.colorBgContainer, padding: 8 }}>
      <div
        style={{ minHeight: 200 }}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }}
        onDrop={(e) => {
          const elements = document.elementsFromPoint(e.clientX, e.clientY)
          const target = elements.find((el) => el.hasAttribute?.('data-drop-path')) as HTMLElement | null
          const targetPath = target?.getAttribute('data-drop-path') ?? currentPath
          onDrop(e, targetPath)
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Tag
            color="blue"
            icon={<PlusCircleOutlined />}
            onClick={handleExpandAll}
            style={{
              cursor: 'pointer',
              margin: 0,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            Expand
          </Tag>
          <Tag
            color="blue"
            icon={<MinusCircleOutlined />}
            onClick={handleCollapseAll}
            style={{
              cursor: 'pointer',
              margin: 0,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            Collapse
          </Tag>
        </div>
        <Tree
          showIcon
          blockNode
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys)}
          treeData={treeWithHome}
          loadData={(node) => {
            if ((node.key as string) === '') return Promise.resolve()
            return onTreeLoadData(node)
          }}
          onSelect={onTreeSelect}
          selectedKeys={currentPath ? [currentPath] : ['']}
          style={{ marginTop: 8 }}
        />
      </div>
    </Sider>
  )
}
