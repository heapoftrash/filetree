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
  openPreview: (record: Entry) => void
  previewFullscreen: boolean
  setPreviewFullscreen: (v: boolean | ((prev: boolean) => boolean)) => void
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
    openPreview,
    previewFullscreen,
    setPreviewFullscreen,
    goToPrevFile,
    goToNextFile,
  } = params

  // Keyboard: Enter = open folder, Delete = bulk delete, Space = Quick Look
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return
      if (ev.key === 'Enter') {
        if (selectedRowKeys.length === 1) {
          const entry = entries.find((e) => e.path === selectedRowKeys[0])
          if (entry?.isDir) navigate(`/files/${entry.path}`)
        }
      } else if (ev.key === ' ' || ev.key === 'Spacebar') {
        ev.preventDefault()
        if (previewFullscreen) {
          setPreviewFullscreen(false)
          return
        }
        if (previewEntry && !previewEntry.isDir) {
          setPreviewFullscreen(true)
          return
        }
        const key = selectedRowKeys.length === 1 ? (selectedRowKeys[0] as string) : null
        const entry = key ? entries.find((e) => e.path === key) : null
        if (entry && !entry.isDir) {
          openPreview(entry)
          setPreviewFullscreen(true)
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
  }, [
    selectedRowKeys,
    entries,
    navigate,
    handleBulkDelete,
    previewEntry,
    previewFullscreen,
    openPreview,
    setPreviewFullscreen,
  ])

  // Keyboard: Arrow keys for prev/next, Escape closes fullscreen then preview
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (!previewEntry) return
      if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return
      if (ev.key === 'Escape') {
        ev.preventDefault()
        if (previewFullscreen) {
          setPreviewFullscreen(false)
        } else {
          setPreviewEntry(null)
        }
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
  }, [
    previewEntry,
    previewFullscreen,
    setPreviewEntry,
    setPreviewFullscreen,
    goToPrevFile,
    goToNextFile,
  ])
}
