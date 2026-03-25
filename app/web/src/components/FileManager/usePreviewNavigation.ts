import { useCallback, useEffect } from 'react'
import type { Entry } from '../../types'

export function usePreviewNavigation(
  filteredEntries: Entry[],
  previewEntry: Entry | null,
  setPreviewEntry: (e: Entry | null) => void,
  setCopyableContent: (c: string | null) => void,
  setPreviewSearchQuery: (q: string) => void,
  tableRef: React.RefObject<HTMLDivElement | null>,
  savedScrollTopRef: React.MutableRefObject<number | null>,
) {
  const previewableFiles = filteredEntries.filter((e) => !e.isDir)
  const previewCurrentIndex = previewEntry
    ? previewableFiles.findIndex((e) => e.path === previewEntry.path)
    : -1
  const hasPrevFile = previewCurrentIndex > 0
  const hasNextFile = previewCurrentIndex >= 0 && previewCurrentIndex < previewableFiles.length - 1

  const openPreview = useCallback(
    (record: Entry) => {
      savedScrollTopRef.current = tableRef.current?.scrollTop ?? 0
      setPreviewEntry(record)
    },
    [setPreviewEntry, tableRef, savedScrollTopRef],
  )

  const goToPrevFile = useCallback(() => {
    if (previewCurrentIndex > 0) setPreviewEntry(previewableFiles[previewCurrentIndex - 1])
  }, [previewableFiles, previewCurrentIndex, setPreviewEntry])

  const goToNextFile = useCallback(() => {
    if (previewCurrentIndex >= 0 && previewCurrentIndex < previewableFiles.length - 1) {
      setPreviewEntry(previewableFiles[previewCurrentIndex + 1])
    }
  }, [previewableFiles, previewCurrentIndex, setPreviewEntry])

  // Reset copyable content and search when switching preview
  useEffect(() => {
    setCopyableContent(null)
    setPreviewSearchQuery('')
  }, [previewEntry?.path, setCopyableContent, setPreviewSearchQuery])

  // Restore list scroll position when preview opens (layout switches to split view)
  useEffect(() => {
    if (!previewEntry || savedScrollTopRef.current === null) return
    const el = tableRef.current
    if (!el) return
    const top = savedScrollTopRef.current
    savedScrollTopRef.current = null
    requestAnimationFrame(() => {
      el.scrollTop = top
    })
  }, [previewEntry, tableRef, savedScrollTopRef])

  return {
    previewableFiles,
    previewCurrentIndex,
    hasPrevFile,
    hasNextFile,
    openPreview,
    goToPrevFile,
    goToNextFile,
  }
}
