import { useState, useEffect, useCallback } from 'react'
import { FolderOutlined } from '@ant-design/icons'
import { message } from 'antd'
import type { DataNode } from 'antd/es/tree'
import { listEntries } from '../../api/client'
import type { Entry } from '../../types'
import { getApiErrorMessage } from '../../utils/errors'

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

export interface ConflictModalState {
  type: 'rename' | 'move'
  onOverwrite: () => void
  onKeepBoth: () => void
}

export function useFileManagerState(currentPath: string) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [treeData, setTreeData] = useState<DataNode[]>([])
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
      setEntries(list)
    } catch (e: unknown) {
      message.error(getApiErrorMessage(e))
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEntries(currentPath)
  }, [currentPath, loadEntries])

  const loadTree = useCallback(async () => {
    try {
      const { entries: list } = await listEntries('')
      const nodes: DataNode[] = (list || [])
        .filter((e) => e.isDir)
        .map((e) => ({
          key: e.path,
          title: e.name,
          icon: <FolderOutlined />,
          isLeaf: false,
          children: [],
        }))
      setTreeData(nodes)
    } catch {
      setTreeData([])
    }
  }, [])

  useEffect(() => {
    loadTree()
  }, [loadTree])

  const onTreeLoadData = useCallback(
    (node: DataNode) =>
      new Promise<void>((resolve, reject) => {
        const path = node.key as string
        if (node.children && (node.children as DataNode[]).length > 0) {
          resolve()
          return
        }
        listEntries(path)
          .then(({ entries: list }) => {
            const children: DataNode[] = (list || [])
              .filter((e) => e.isDir)
              .map((e) => ({
                key: e.path,
                title: e.name,
                icon: <FolderOutlined />,
                isLeaf: false,
                children: [],
              }))
            setTreeData((prev) => updateTreeData(prev, node.key as React.Key, children))
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
