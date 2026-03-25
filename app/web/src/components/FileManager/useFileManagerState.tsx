import { useState, useEffect, useCallback } from 'react'
import { FolderOutlined } from '@ant-design/icons'
import { message } from 'antd'
import type { DataNode } from 'antd/es/tree'
import { listEntries } from '../../api/client'
import type { Entry } from '../../types'
import { getApiErrorMessage } from '../../utils/errors'
import { isTrashTimestampBucketName, trashBucketDisplayLabel } from '../../utils/pathUtils'

function updateTreeData(list: DataNode[], key: React.Key, children: DataNode[]): DataNode[] {
  return list.map((node) => {
    if (node.key === key) {
      return { ...node, children, isLeaf: children.length === 0 }
    }
    if (node.children) {
      return { ...node, children: updateTreeData(node.children, key, children) }
    }
    return node
  })
}

function dirToTreeNode(listPath: string, e: Entry): DataNode {
  const title =
    listPath === '.trash' && e.isDir && isTrashTimestampBucketName(e.name)
      ? trashBucketDisplayLabel(e.name)
      : e.name
  return {
    key: e.path,
    title,
    icon: <FolderOutlined />,
    isLeaf: false,
    children: [],
  }
}

export interface ConflictModalState {
  type: 'rename' | 'move'
  onOverwrite: () => void
  onKeepBoth: () => void
}

export function useFileManagerState(currentPath: string) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [treeData, setTreeData] = useState<DataNode[]>([])
  const [trashTreeData, setTrashTreeData] = useState<DataNode[]>([])
  const [trashTreeHydrated, setTrashTreeHydrated] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameEntryPath, setRenameEntryPath] = useState('')
  const [renameName, setRenameName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [moveCopyOpen, setMoveCopyOpen] = useState<'move' | 'copy' | null>(null)
  const [moveCopyDest, setMoveCopyDest] = useState('')
  const [moveCopyLoading, setMoveCopyLoading] = useState(false)
  const [previewEntry, setPreviewEntry] = useState<Entry | null>(null)
  const [bulkDownloading, setBulkDownloading] = useState(false)
  const [conflictModal, setConflictModal] = useState<ConflictModalState | null>(null)

  const loadEntries = useCallback(async (path: string) => {
    setLoading(true)
    try {
      const { entries: list } = await listEntries(path)
      setEntries(Array.isArray(list) ? list : [])
    } catch (e: unknown) {
      message.error(getApiErrorMessage(e))
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadEntries(currentPath)
  }, [currentPath, loadEntries])

  const loadTree = useCallback(async () => {
    setTrashTreeData([])
    setTrashTreeHydrated(false)
    try {
      const { entries: list } = await listEntries('')
      const nodes: DataNode[] = (list || [])
        .filter((e) => e.isDir && e.path !== '.trash')
        .map((e) => dirToTreeNode('', e))
      setTreeData(nodes)
    } catch {
      setTreeData([])
    }
  }, [])

  useEffect(() => {
    loadTree()
  }, [loadTree])

  useEffect(() => {
    if (trashTreeHydrated) return
    if (currentPath !== '.trash' && !currentPath.startsWith('.trash/')) return
    let cancelled = false
    listEntries('.trash')
      .then(({ entries: list }) => {
        if (cancelled) return
        const children: DataNode[] = (list || [])
          .filter((e) => e.isDir)
          .map((e) => dirToTreeNode('.trash', e))
        setTrashTreeData(children)
        setTrashTreeHydrated(true)
      })
      .catch(() => {
        if (!cancelled) {
          setTrashTreeData([])
          setTrashTreeHydrated(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [currentPath, trashTreeHydrated])

  const onTreeLoadData = useCallback(
    (node: DataNode) =>
      new Promise<void>((resolve, reject) => {
        const path = node.key as string
        if (node.children && (node.children as DataNode[]).length > 0) {
          resolve()
          return
        }
        const underTrash = path === '.trash' || path.startsWith('.trash/')
        listEntries(path)
          .then(({ entries: list }) => {
            const children: DataNode[] = (list || [])
              .filter((e) => e.isDir && (underTrash || e.path !== '.trash'))
              .map((e) => dirToTreeNode(path, e))
            if (path === '.trash') {
              setTrashTreeData(children)
              setTrashTreeHydrated(true)
            } else if (underTrash) {
              setTrashTreeData((prev) => updateTreeData(prev, node.key as React.Key, children))
            } else {
              setTreeData((prev) => updateTreeData(prev, node.key as React.Key, children))
            }
            resolve()
          })
          .catch(reject)
      }),
    [],
  )

  return {
    entries,
    loading,
    treeData,
    trashTreeData,
    trashTreeHydrated,
    selectedRowKeys,
    setSelectedRowKeys,
    newFolderOpen,
    setNewFolderOpen,
    newFolderName,
    setNewFolderName,
    renameOpen,
    setRenameOpen,
    renameEntryPath,
    setRenameEntryPath,
    renameName,
    setRenameName,
    uploading,
    setUploading,
    moveCopyOpen,
    setMoveCopyOpen,
    moveCopyDest,
    setMoveCopyDest,
    moveCopyLoading,
    setMoveCopyLoading,
    previewEntry,
    setPreviewEntry,
    bulkDownloading,
    setBulkDownloading,
    conflictModal,
    setConflictModal,
    loadEntries,
    loadTree,
    onTreeLoadData,
  }
}
