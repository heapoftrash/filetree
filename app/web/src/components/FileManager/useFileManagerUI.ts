import { useState, useCallback } from 'react'
import { SORT_STORAGE_KEY, VIEW_MODE_KEY, SIDEBAR_VISIBLE_KEY } from './useFileManagerConstants'

export function useFileManagerUI() {
  const [sortField, setSortField] = useState<string | undefined>(() => {
    try {
      const s = localStorage.getItem(SORT_STORAGE_KEY)
      if (s) {
        const { field, order } = JSON.parse(s) as { field?: string; order?: string }
        if (field && order) return field
      }
    } catch {
      /* invalid stored sort, use default */
    }
    return undefined
  })
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>(() => {
    try {
      const s = localStorage.getItem(SORT_STORAGE_KEY)
      if (s) {
        const { order } = JSON.parse(s) as { order?: string }
        if (order === 'ascend' || order === 'descend') return order
      }
    } catch {
      /* invalid stored sort, use default */
    }
    return null
  })
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    try {
      const v = localStorage.getItem(VIEW_MODE_KEY)
      if (v === 'list' || v === 'grid') return v
    } catch {
      /* invalid stored view, use default */
    }
    return 'list'
  })
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    try {
      const v = localStorage.getItem(SIDEBAR_VISIBLE_KEY)
      if (v === 'false') return false
      if (v === 'true') return true
    } catch {
      /* invalid stored sidebar pref, use default */
    }
    return true
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [copyableContent, setCopyableContent] = useState<string | null>(null)
  const [previewFullscreen, setPreviewFullscreen] = useState(false)
  const [previewSearchQuery, setPreviewSearchQuery] = useState('')

  const saveSort = useCallback((field: string | undefined, order: 'ascend' | 'descend' | null) => {
    if (field && order) {
      try {
        localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify({ field, order }))
      } catch {
        /* quota exceeded or private mode, ignore */
      }
    }
  }, [])

  const setViewModeAndSave = useCallback((mode: 'list' | 'grid') => {
    setViewMode(mode)
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode)
    } catch {
      /* quota exceeded or private mode, ignore */
    }
  }, [])

  const setSidebarVisibleAndSave = useCallback((v: boolean) => {
    setSidebarVisible(v)
    try {
      localStorage.setItem(SIDEBAR_VISIBLE_KEY, String(v))
    } catch {
      /* quota exceeded or private mode, ignore */
    }
  }, [])

  return {
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    saveSort,
    viewMode,
    setViewMode,
    setViewModeAndSave,
    sidebarVisible,
    setSidebarVisible,
    setSidebarVisibleAndSave,
    searchQuery,
    setSearchQuery,
    copyableContent,
    setCopyableContent,
    previewFullscreen,
    setPreviewFullscreen,
    previewSearchQuery,
    setPreviewSearchQuery,
  }
}
