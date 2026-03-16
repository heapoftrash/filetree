import { useState, useCallback } from 'react'
import { Breadcrumb, Dropdown } from 'antd'
import { FolderOutlined, HomeOutlined, DownOutlined } from '@ant-design/icons'
import { listEntries } from '../../api/client'
import type { Entry } from '../../types'
import { pathSegments } from '../../utils/pathUtils'

function BreadcrumbHome({ navigate }: { navigate: (path: string) => void }) {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault()
        navigate('/files')
      }}
      style={{ color: 'inherit', cursor: 'pointer' }}
    >
      <HomeOutlined />
    </a>
  )
}

function BreadcrumbSegmentDropdown({
  segment,
  parentPath,
  navigate,
}: {
  segment: { label: string; path: string }
  parentPath: string
  navigate: (path: string) => void
}) {
  const [siblings, setSiblings] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)

  const loadSiblings = useCallback(() => {
    setLoading(true)
    listEntries(parentPath)
      .then(({ entries }) => setSiblings((entries || []).filter((e) => e.isDir)))
      .catch(() => setSiblings([]))
      .finally(() => setLoading(false))
  }, [parentPath])

  const menuItems = loading
    ? [{ key: 'loading', label: 'Loading...', disabled: true }]
    : siblings.map((e) => ({
        key: e.path,
        icon: <FolderOutlined />,
        label: e.name,
        onClick: () => navigate(`/files/${e.path}`),
      }))

  return (
    <Dropdown
      menu={{ items: menuItems }}
      onOpenChange={(open) => open && loadSiblings()}
      trigger={['click']}
    >
      <a onClick={(e) => e.preventDefault()} style={{ color: 'inherit', cursor: 'pointer' }}>
        {segment.label} <DownOutlined style={{ fontSize: 10, marginLeft: 4 }} />
      </a>
    </Dropdown>
  )
}

function BreadcrumbSegment({
  segment,
  parentPath,
  isHome,
  navigate,
}: {
  segment: { label: string; path: string }
  parentPath: string
  isHome: boolean
  navigate: (path: string) => void
}) {
  if (isHome) return <BreadcrumbHome navigate={navigate} />
  return <BreadcrumbSegmentDropdown segment={segment} parentPath={parentPath} navigate={navigate} />
}

interface FileBreadcrumbProps {
  currentPath: string
  navigate: (path: string) => void
}

export default function FileBreadcrumb({ currentPath, navigate }: FileBreadcrumbProps) {
  const segments = pathSegments(currentPath)
  return (
    <Breadcrumb
      items={segments.map((s, i) => ({
        title: (
          <BreadcrumbSegment
            segment={s}
            parentPath={i === 0 ? '' : segments[i - 1].path}
            isHome={i === 0}
            navigate={navigate}
          />
        ),
      }))}
    />
  )
}
