import { useEffect } from 'react'
import { Modal } from 'antd'
import type { Entry } from '../../types'
import { isInTrash } from '../../utils/pathUtils'

export function useFileManagerKeyboard(params: {
  selectedRowKeys: React.Key[]
  entries: Entry[]
  navigate: (path: string) => void
  handleBulkDelete: (pathsOverride?: string[]) => Promise<void>
  previewEntry: Entry | null
  setPreviewEntry: (e: Entry | null) => void
  goToPrevFile: () => void
  goToNextFile: () => void
}) {
  const {
    selectedRowKeys,
    entries,
    navigate,
    handleBulkDelete,
    previewEntry,
    setPreviewEntry,
    goToPrevFile,
    goToNextFile,
  } = params

  // Keyboard: Enter = open folder, Delete = bulk delete
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return
      if (ev.key === 'Enter') {
        if (selectedRowKeys.length === 1) {
          const entry = entries.find((e) => e.path === selectedRowKeys[0])
          if (entry?.isDir) navigate(`/files/${entry.path}`)
        }
      } else if (ev.key === 'Delete' && selectedRowKeys.length > 0) {
        ev.preventDefault()
        const paths = selectedRowKeys as string[]
        const inTrash = paths.some((p) => isInTrash(p))
        if (inTrash) {
          Modal.confirm({
            title: 'Permanently delete from trash?',
            content: 'This cannot be undone.',
            okText: 'Delete',
            okButtonProps: { danger: true },
            onOk: () => handleBulkDelete(),
          })
        } else {
          handleBulkDelete()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedRowKeys, entries, navigate, handleBulkDelete])

  // Keyboard: Arrow keys for prev/next, Escape to close when preview is open
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (!previewEntry) return
      if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return
      if (ev.key === 'Escape') {
        ev.preventDefault()
        setPreviewEntry(null)
      } else if (ev.key === 'ArrowRight') {
        ev.preventDefault()
        goToNextFile()
      } else if (ev.key === 'ArrowLeft') {
        ev.preventDefault()
        goToPrevFile()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [previewEntry, setPreviewEntry, goToPrevFile, goToNextFile])
}
