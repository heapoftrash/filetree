import { useCallback, useRef } from 'react'
import { message } from 'antd'
import {
  createFolder,
  renameEntry,
  deleteEntry,
  restoreFromTrash,
  listEntries,
  uploadFiles,
  moveEntry,
  copyEntry,
  downloadZip,
} from '../../api/client'
import type { Entry } from '../../types'
import { getApiErrorMessage, isConflictError, isNotFoundError } from '../../utils/errors'
import { uniqueName, isRestorableTrashPath, parentLogicalPath } from '../../utils/pathUtils'
import type { ConflictModalState } from './useFileManagerState'

/** Walk up until list succeeds (handles trash bucket removed after restore). */
async function firstListablePath(start: string): Promise<string> {
  let p = start
  while (true) {
    try {
      await listEntries(p)
      return p
    } catch (e) {
      if (!isNotFoundError(e)) throw e
      if (p === '') return ''
      p = parentLogicalPath(p)
    }
  }
}

export interface UseFileManagerActionsParams {
  currentPath: string
  entries: Entry[]
  selectedRowKeys: React.Key[]
  previewEntry: Entry | null
  newFolderName: string
  renameEntryPath: string
  renameName: string
  moveCopyOpen: 'move' | 'copy' | null
  moveCopyDest: string
  loadEntries: (path: string) => Promise<void>
  loadTree: () => Promise<void>
  /** Latest routed path (ref) so undo handlers do not use a stale closure */
  getCurrentPath: () => string
  /** Navigate file manager to a logical path (`''` = home) */
  navigateToFilesPath: (logicalPath: string) => void
  setSelectedRowKeys: React.Dispatch<React.SetStateAction<React.Key[]>>
  setNewFolderOpen: (v: boolean) => void
  setNewFolderName: (v: string) => void
  setRenameOpen: (v: boolean) => void
  setRenameEntryPath: (v: string) => void
  setRenameName: (v: string) => void
  setMoveCopyOpen: (v: 'move' | 'copy' | null) => void
  setMoveCopyDest: (v: string) => void
  setConflictModal: (v: ConflictModalState | null) => void
  setPreviewEntry: (v: Entry | null) => void
  setUploading: (v: boolean) => void
  setBulkDownloading: (v: boolean) => void
  setMoveCopyLoading: (v: boolean) => void
  copyableContent: string | null
}

export function useFileManagerActions(params: UseFileManagerActionsParams) {
  const {
    currentPath,
    entries,
    selectedRowKeys,
    previewEntry,
    newFolderName,
    renameEntryPath,
    renameName,
    moveCopyOpen,
    moveCopyDest,
    loadEntries,
    loadTree,
    getCurrentPath,
    navigateToFilesPath,
    setSelectedRowKeys,
    setNewFolderOpen,
    setNewFolderName,
    setRenameOpen,
    setRenameEntryPath,
    setRenameName,
    setMoveCopyOpen,
    setMoveCopyDest,
    setConflictModal,
    setPreviewEntry,
    setUploading,
    setBulkDownloading,
    setMoveCopyLoading,
    copyableContent,
  } = params

  const syncListAfterTrashRestore = useCallback(async () => {
    const cp = getCurrentPath()
    try {
      const next = await firstListablePath(cp)
      if (next !== cp) {
        navigateToFilesPath(next)
      } else {
        await loadEntries(cp)
      }
    } catch (e: unknown) {
      message.error(getApiErrorMessage(e))
    }
    await loadTree()
  }, [getCurrentPath, navigateToFilesPath, loadEntries, loadTree])

  const handleNewFolder = useCallback(async () => {
    if (!newFolderName.trim()) return
    try {
      await createFolder(currentPath, newFolderName.trim())
      message.success('Folder created')
      setNewFolderOpen(false)
      setNewFolderName('')
      loadEntries(currentPath)
      loadTree()
    } catch (e: unknown) {
      message.error(getApiErrorMessage(e))
    }
  }, [currentPath, newFolderName, setNewFolderOpen, setNewFolderName, loadEntries, loadTree])

  const handleRenameRef = useRef<((overwrite?: boolean, useNewName?: string) => Promise<void>) | undefined>(undefined)
  const handleRename = useCallback(
    async (overwrite = false, useNewName?: string) => {
      const name = useNewName ?? renameName.trim()
      if (!name) return
      try {
        await renameEntry(renameEntryPath, name, { overwrite })
        message.success('Renamed')
        setRenameOpen(false)
        setRenameEntryPath('')
        setRenameName('')
        setConflictModal(null)
        loadEntries(currentPath)
        loadTree()
      } catch (e: unknown) {
        if (isConflictError(e) && !overwrite && !useNewName) {
          const fn = handleRenameRef.current!
          setConflictModal({
            type: 'rename',
            onOverwrite: () => fn(true),
            onKeepBoth: () => fn(false, uniqueName(renameName.trim())),
          })
        } else {
          message.error(getApiErrorMessage(e))
        }
      }
    },
    [
      currentPath,
      renameEntryPath,
      renameName,
      setRenameOpen,
      setRenameEntryPath,
      setRenameName,
      setConflictModal,
      loadEntries,
      loadTree,
    ],
  )
  handleRenameRef.current = handleRename

  const handleDelete = useCallback(
    async (path: string) => {
      try {
        const res = await deleteEntry(path)
        setSelectedRowKeys((k) => k.filter((x) => x !== path))
        loadEntries(currentPath)
        loadTree()
        if (res?.trashPath) {
          const key = `undo-${Date.now()}`
          const close = () => message.destroy(key)
          message.success({
            content: (
              <span>
                Moved to trash.{' '}
                <a
                  onClick={() => {
                    close()
                    restoreFromTrash(res.trashPath!)
                      .then(() => {
                        message.success('Restored')
                        return syncListAfterTrashRestore()
                      })
                      .catch((e) => message.error(getApiErrorMessage(e)))
                  }}
                >
                  Undo
                </a>
              </span>
            ),
            key,
            duration: 5,
          })
        } else {
          message.success('Deleted')
        }
      } catch (e: unknown) {
        message.error(getApiErrorMessage(e))
      }
    },
    [currentPath, setSelectedRowKeys, loadEntries, loadTree, syncListAfterTrashRestore],
  )

  const handleRestore = useCallback(
    async (path: string) => {
      if (!isRestorableTrashPath(path)) return
      try {
        await restoreFromTrash(path)
        message.success('Restored')
        setSelectedRowKeys((k) => k.filter((x) => x !== path))
        if (previewEntry?.path === path) setPreviewEntry(null)
        await syncListAfterTrashRestore()
      } catch (e: unknown) {
        message.error(getApiErrorMessage(e))
      }
    },
    [previewEntry, setSelectedRowKeys, setPreviewEntry, syncListAfterTrashRestore],
  )

  const handleBulkRestore = useCallback(
    async (pathsOverride?: string[]) => {
      const keys = (pathsOverride ?? (selectedRowKeys as string[])).filter((p) => isRestorableTrashPath(p))
      if (keys.length === 0) return
      try {
        await Promise.all(keys.map((p) => restoreFromTrash(p)))
        message.success(`Restored ${keys.length} item(s)`)
        setSelectedRowKeys([])
        if (previewEntry && keys.includes(previewEntry.path)) setPreviewEntry(null)
        await syncListAfterTrashRestore()
      } catch (e: unknown) {
        message.error(getApiErrorMessage(e))
      }
    },
    [selectedRowKeys, previewEntry, setSelectedRowKeys, setPreviewEntry, syncListAfterTrashRestore],
  )

  const handleBulkDelete = useCallback(
    async (pathsOverride?: string[]) => {
      const paths = pathsOverride ?? (selectedRowKeys as string[])
      if (paths.length === 0) return
      try {
        const trashPaths: string[] = []
        for (const path of paths) {
          const res = await deleteEntry(path)
          if (res?.trashPath) trashPaths.push(res.trashPath)
        }
        setSelectedRowKeys([])
        loadEntries(currentPath)
        loadTree()
        if (trashPaths.length > 0) {
          const key = `undo-bulk-${Date.now()}`
          message.success({
            content: (
              <span>
                Moved {trashPaths.length} item(s) to trash.{' '}
                <a
                  onClick={() => {
                    message.destroy(key)
                    Promise.all(trashPaths.map((p) => restoreFromTrash(p)))
                      .then(() => {
                        message.success('Restored')
                        return syncListAfterTrashRestore()
                      })
                      .catch((e) => message.error(getApiErrorMessage(e)))
                  }}
                >
                  Undo
                </a>
              </span>
            ),
            key,
            duration: 5,
          })
        } else {
          message.success(`Deleted ${paths.length} item(s)`)
        }
        if (previewEntry && paths.includes(previewEntry.path)) setPreviewEntry(null)
      } catch (e: unknown) {
        message.error(getApiErrorMessage(e))
      }
    },
    [currentPath, selectedRowKeys, previewEntry, setSelectedRowKeys, setPreviewEntry, loadEntries, loadTree, syncListAfterTrashRestore],
  )

  const handleMoveCopyRef = useRef<((overwrite?: boolean, newName?: string) => Promise<void>) | undefined>(undefined)
  const handleMoveCopy = useCallback(
    async (overwrite = false, newNameForPath?: string) => {
      if (!moveCopyDest || moveCopyDest === currentPath) {
        message.warning('Choose a different destination folder')
        return
      }
      setMoveCopyLoading(true)
      const paths = previewEntry ? [previewEntry.path] : (selectedRowKeys as string[])
      try {
        for (let i = 0; i < paths.length; i++) {
          const path = paths[i]
          const opts = newNameForPath ? { newName: newNameForPath } : overwrite ? { overwrite: true } : undefined
          try {
            if (moveCopyOpen === 'move') await moveEntry(path, moveCopyDest, opts)
            else await copyEntry(path, moveCopyDest, opts)
          } catch (e: unknown) {
            if (isConflictError(e) && !overwrite && !newNameForPath) {
              const entry = entries.find((x) => x.path === path)
              const suggestedName = entry ? uniqueName(entry.name) : undefined
              const fn = handleMoveCopyRef.current!
              setConflictModal({
                type: 'move',
                onOverwrite: () => fn(true),
                onKeepBoth: () => fn(false, suggestedName),
              })
              return
            }
            throw e
          }
        }
        message.success(moveCopyOpen === 'move' ? 'Moved' : 'Copied')
        setMoveCopyOpen(null)
        setMoveCopyDest('')
        setSelectedRowKeys([])
        setConflictModal(null)
        if (previewEntry && paths.includes(previewEntry.path)) setPreviewEntry(null)
        loadEntries(currentPath)
        loadTree()
      } catch (e: unknown) {
        message.error(getApiErrorMessage(e))
      } finally {
        setMoveCopyLoading(false)
      }
    },
    [
      currentPath,
      moveCopyDest,
      moveCopyOpen,
      previewEntry,
      selectedRowKeys,
      entries,
      setMoveCopyOpen,
      setMoveCopyDest,
      setSelectedRowKeys,
      setConflictModal,
      setPreviewEntry,
      setMoveCopyLoading,
      loadEntries,
      loadTree,
    ],
  )
  handleMoveCopyRef.current = handleMoveCopy

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true)
      try {
        await uploadFiles(currentPath, [file])
        message.success(`${file.name} uploaded`)
        loadEntries(currentPath)
      } catch (e: unknown) {
        message.error(getApiErrorMessage(e))
      } finally {
        setUploading(false)
      }
      return false
    },
    [currentPath, setUploading, loadEntries],
  )

  const openRename = useCallback(
    (entry: Entry) => {
      setRenameEntryPath(entry.path)
      setRenameName(entry.name)
      setRenameOpen(true)
    },
    [setRenameEntryPath, setRenameName, setRenameOpen],
  )

  const handleBulkDownload = useCallback(
    async (pathsOverride?: string[]) => {
      const paths =
        pathsOverride ??
        (selectedRowKeys as string[]).filter((key) => {
          const e = entries.find((x) => x.path === key)
          return e && !e.isDir
        })
      if (paths.length === 0) {
        message.warning('Select at least one file to download')
        return
      }
      setBulkDownloading(true)
      try {
        const blob = await downloadZip(paths)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'download.zip'
        a.click()
        URL.revokeObjectURL(url)
        message.success('Download started')
      } catch (e: unknown) {
        message.error(getApiErrorMessage(e))
      } finally {
        setBulkDownloading(false)
      }
    },
    [selectedRowKeys, entries, setBulkDownloading],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent, targetPath: string) => {
      e.preventDefault()
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json') || '{}') as {
          paths?: string[]
          action?: string
        }
        const paths = data.paths as string[] | undefined
        if (!paths?.length) return
        const targetDir = targetPath || '.'
        const action = data.action === 'copy' || e.ctrlKey || e.metaKey ? 'copy' : 'move'
        const toMove = paths.filter((path) => {
          if (path === targetDir) return false
          const parentPath = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''
          const parentNorm = parentPath || '.'
          return parentNorm !== targetDir
        })
        if (!toMove.length) {
          message.info('Already in this folder')
          return
        }
        void (async () => {
          try {
            for (const path of toMove) {
              if (action === 'move') await moveEntry(path, targetDir)
              else await copyEntry(path, targetDir)
            }
            message.success(action === 'move' ? 'Moved' : 'Copied')
            loadEntries(currentPath)
            loadTree()
          } catch (err: unknown) {
            message.error(getApiErrorMessage(err))
          }
        })()
      } catch {
        /* invalid drag data, ignore */
      }
    },
    [currentPath, loadEntries, loadTree],
  )

  const handleCopyContent = useCallback(async () => {
    if (!copyableContent) return
    try {
      await navigator.clipboard.writeText(copyableContent)
      message.success('Copied to clipboard')
    } catch {
      message.error('Failed to copy')
    }
  }, [copyableContent])

  const handleDragStart = useCallback((e: React.DragEvent, record: Entry) => {
    const action = e.ctrlKey || e.metaKey ? 'copy' : 'move'
    e.dataTransfer.setData('application/json', JSON.stringify({ paths: [record.path], action }))
    e.dataTransfer.effectAllowed = 'copyMove'
  }, [])

  return {
    handleNewFolder,
    handleRename,
    handleDelete,
    handleRestore,
    handleBulkRestore,
    handleBulkDelete,
    handleMoveCopy,
    handleUpload,
    openRename,
    handleBulkDownload,
    handleDrop,
    handleCopyContent,
    handleDragStart,
  }
}
