import { useState, useCallback } from 'react'
import { Breadcrumb, Dropdown } from 'antd'
import { FolderOutlined, HomeOutlined, DownOutlined } from '@ant-design/icons'
import { listEntries } from '../../api/client'
import type { Entry } from '../../types'
import { pathSegments, breadcrumbSegmentLabel, listDisplayName } from '../../utils/pathUtils'

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
  parentPath,
  displayLabel,
  navigate,
}: {
  parentPath: string
  displayLabel: string
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
        label: listDisplayName(e, parentPath),
        onClick: () => navigate(`/files/${e.path}`),
      }))

  return (
    <Dropdown
      menu={{ items: menuItems }}
      onOpenChange={(open) => open && loadSiblings()}
      trigger={['click']}
    >
      <a onClick={(e) => e.preventDefault()} style={{ color: 'inherit', cursor: 'pointer' }}>
        {displayLabel} <DownOutlined style={{ fontSize: 10, marginLeft: 4 }} />
      </a>
    </Dropdown>
  )
}

function BreadcrumbSegment({
  parentPath,
  displayLabel,
  isHome,
  navigate,
}: {
  parentPath: string
  displayLabel: string
  isHome: boolean
  navigate: (path: string) => void
}) {
  if (isHome) return <BreadcrumbHome navigate={navigate} />
  return (
    <BreadcrumbSegmentDropdown parentPath={parentPath} displayLabel={displayLabel} navigate={navigate} />
  )
}

interface FileBreadcrumbProps {
  currentPath: string
  navigate: (path: string) => void
}

export default function FileBreadcrumb({ currentPath, navigate }: FileBreadcrumbProps) {
  const segments = pathSegments(currentPath)
  return (
    <Breadcrumb
      items={segments.map((s, i) => {
        const parentPath = i === 0 ? '' : segments[i - 1].path
        const displayLabel = breadcrumbSegmentLabel(s, parentPath)
        return {
          title: (
            <BreadcrumbSegment
              parentPath={parentPath}
              displayLabel={displayLabel}
              isHome={i === 0}
              navigate={navigate}
            />
          ),
        }
      })}
    />
  )
}
