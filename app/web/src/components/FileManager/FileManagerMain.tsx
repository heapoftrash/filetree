import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import FileManagerLayout from './FileManagerLayout'
import { useDefaultLayout } from 'react-resizable-panels'
import { useFileManagerState, useFileManagerUI, useFileManagerActions, usePreviewNavigation, useFileManagerKeyboard, PREVIEW_PANEL_LAYOUT_KEY } from './hooks'
import { listDisplayName } from '../../utils/pathUtils'
import type { Entry } from '../../types'
import { getPreviewCategory } from '../../preview'

function useCurrentPath(): string {
  const { '*': splat } = useParams<{ '*': string }>()
  return splat?.replace(/^\/+|\/+$/g, '') || ''
}

export default function FileManagerMain() {
  const currentPath = useCurrentPath()
  const currentPathRef = useRef(currentPath)
  currentPathRef.current = currentPath
  const navigate = useNavigate()
  const tableRef = useRef<HTMLDivElement>(null)
  const savedScrollTopRef = useRef<number | null>(null)

  const state = useFileManagerState(currentPath)
  const ui = useFileManagerUI()

  const actions = useFileManagerActions({
    currentPath,
    entries: state.entries,
    selectedRowKeys: state.selectedRowKeys,
    previewEntry: state.previewEntry,
    newFolderName: state.newFolderName,
    renameEntryPath: state.renameEntryPath,
    renameName: state.renameName,
    moveCopyOpen: state.moveCopyOpen,
    moveCopyDest: state.moveCopyDest,
    loadEntries: state.loadEntries,
    loadTree: state.loadTree,
    getCurrentPath: () => currentPathRef.current,
    navigateToFilesPath: (logicalPath: string) =>
      navigate(logicalPath === '' ? '/files' : `/files/${logicalPath}`),
    setSelectedRowKeys: state.setSelectedRowKeys,
    setNewFolderOpen: state.setNewFolderOpen,
    setNewFolderName: state.setNewFolderName,
    setRenameOpen: state.setRenameOpen,
    setRenameEntryPath: state.setRenameEntryPath,
    setRenameName: state.setRenameName,
    setMoveCopyOpen: state.setMoveCopyOpen,
    setMoveCopyDest: state.setMoveCopyDest,
    setConflictModal: state.setConflictModal,
    setPreviewEntry: state.setPreviewEntry,
    setUploading: state.setUploading,
    setBulkDownloading: state.setBulkDownloading,
    setMoveCopyLoading: state.setMoveCopyLoading,
    copyableContent: ui.copyableContent,
  })

  const filteredEntries = (() => {
    let list =
      currentPath === '' ? state.entries.filter((e) => e.path !== '.trash') : state.entries
    if (ui.searchQuery.trim()) {
      const q = ui.searchQuery.trim().toLowerCase()
      list = list.filter((e) => {
        const display = listDisplayName(e, currentPath)
        return (
          display.toLowerCase().includes(q) ||
          e.name.toLowerCase().includes(q) ||
          e.path.toLowerCase().includes(q)
        )
      })
    }
    if (ui.typeFilter !== 'all') {
      list = list.filter((e) => {
        if (e.isDir) return true
        const cat = getPreviewCategory(e.name)
        if (ui.typeFilter === 'documents') {
          return ['pdf', 'markdown', 'json', 'csv', 'html', 'text'].includes(cat)
        }
        return cat === ui.typeFilter
      })
    }
    return list
  })()

  const previewNav = usePreviewNavigation(
    filteredEntries,
    state.previewEntry,
    state.setPreviewEntry,
    ui.setCopyableContent,
    ui.setPreviewSearchQuery,
    tableRef,
    savedScrollTopRef,
  )

  // Auto-open README when entering a folder (once per path)
  const autoReadmePathRef = useRef<string | null>(null)
  useEffect(() => {
    if (state.loading) return
    if (autoReadmePathRef.current === currentPath) return
    const names = ['README.md', 'readme.md', 'Readme.md', 'README.txt', 'readme.txt']
    const readme = state.entries.find((e) => !e.isDir && names.includes(e.name))
    autoReadmePathRef.current = currentPath
    if (readme) {
      previewNav.openPreview(readme)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once per folder navigation
  }, [currentPath, state.loading, state.entries])

  useFileManagerKeyboard({
    selectedRowKeys: state.selectedRowKeys,
    entries: filteredEntries,
    navigate,
    handleBulkDelete: actions.handleBulkDelete,
    previewEntry: state.previewEntry,
    setPreviewEntry: state.setPreviewEntry,
    openPreview: previewNav.openPreview,
    previewFullscreen: ui.previewFullscreen,
    setPreviewFullscreen: ui.setPreviewFullscreen,
    goToPrevFile: previewNav.goToPrevFile,
    goToNextFile: previewNav.goToNextFile,
  })

  const onTreeSelect = (keys: React.Key[], _info: unknown) => {
    const key = keys[0]
    if (key !== undefined) navigate(`/files/${key}`)
  }

  const previewPath = state.previewEntry?.path ?? null

  const fileListProps = {
    entries: filteredEntries,
    loading: state.loading,
    viewMode: ui.viewMode,
    sortField: ui.sortField,
    sortOrder: ui.sortOrder,
    onSortChange: (field: string | undefined, order: 'ascend' | 'descend' | null) => {
      ui.setSortField(field)
      ui.setSortOrder(order)
      ui.saveSort(field, order)
    },
    selectedRowKeys: state.selectedRowKeys,
    onSelectionChange: (keys: React.Key[]) => state.setSelectedRowKeys(keys),
    previewPath,
    searchQuery: ui.searchQuery,
    onNavigate: (path: string) => navigate(path),
    onOpenPreview: previewNav.openPreview,
    onRename: actions.openRename,
    onDelete: actions.handleDelete,
    onRestore: actions.handleRestore,
    onCopySignedLink: (path: string) => void actions.handleCopySignedLink(path),
    onCopyPath: (path: string) => void actions.handleCopyPath(path),
    onDownload: (path: string) => void actions.handleBulkDownload([path]),
    onStartCopy: (record: Entry) => {
      state.setSelectedRowKeys([record.path])
      state.setMoveCopyDest(currentPath)
      state.setMoveCopyOpen('copy')
    },
    onStartMove: (record: Entry) => {
      state.setSelectedRowKeys([record.path])
      state.setMoveCopyDest(currentPath)
      state.setMoveCopyOpen('move')
    },
    onDragStart: actions.handleDragStart,
    onUpload: actions.handleUpload,
    listParentPath: currentPath,
  }

  const { defaultLayout: previewPanelLayout, onLayoutChanged: onPreviewLayoutChanged } =
    useDefaultLayout({
      id: PREVIEW_PANEL_LAYOUT_KEY,
      storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
      panelIds: ['file-list', 'preview'],
    })

  return (
    <FileManagerLayout
      currentPath={currentPath}
      sidebarVisible={ui.sidebarVisible}
      onSidebarToggle={() => ui.setSidebarVisibleAndSave(!ui.sidebarVisible)}
      treeData={state.treeData}
      trashTreeData={state.trashTreeData}
      trashTreeHydrated={state.trashTreeHydrated}
      onTreeLoadData={state.onTreeLoadData}
      onTreeSelect={(keys) => onTreeSelect(keys, null)}
      onDrop={(e, targetPath) => actions.handleDrop(e, targetPath)}
      fileListProps={fileListProps}
      tableRef={tableRef}
      previewPanelLayout={previewPanelLayout}
      onPreviewLayoutChanged={onPreviewLayoutChanged}
      previewEntry={state.previewEntry}
      hasPrevFile={previewNav.hasPrevFile}
      hasNextFile={previewNav.hasNextFile}
      copyableContent={ui.copyableContent}
      previewSearchQuery={ui.previewSearchQuery}
      onPreviewSearchChange={ui.setPreviewSearchQuery}
      onCopyableContent={ui.setCopyableContent}
      onPrevFile={previewNav.goToPrevFile}
      onNextFile={previewNav.goToNextFile}
      onSearchChange={ui.setSearchQuery}
      onViewModeChange={ui.setViewModeAndSave}
      typeFilter={ui.typeFilter}
      onTypeFilterChange={ui.setTypeFilter}
      onCopyClick={() => {
        state.setMoveCopyDest(currentPath)
        state.setMoveCopyOpen('copy')
      }}
      onMoveClick={() => {
        state.setMoveCopyDest(currentPath)
        state.setMoveCopyOpen('move')
      }}
      onDownloadClick={() => actions.handleBulkDownload()}
      onCopyLinkClick={() => void actions.handleCopySignedLink()}
      onCopyPathClick={() => void actions.handleCopyPath()}
      canCopySignedLink={
        state.selectedRowKeys.length === 1 &&
        !filteredEntries.find((e) => e.path === state.selectedRowKeys[0])?.isDir
      }
      onDeleteClick={() => actions.handleBulkDelete()}
      onRestoreSelection={() => actions.handleBulkRestore()}
      onDownloadPreview={() => actions.handleBulkDownload([state.previewEntry!.path])}
      onDeletePreview={() => actions.handleBulkDelete([state.previewEntry!.path])}
      onRestorePreview={() => {
        const p = state.previewEntry?.path
        if (p) void actions.handleRestore(p)
      }}
      onCopyContent={actions.handleCopyContent}
      onClosePreview={() => state.setPreviewEntry(null)}
      previewFullscreen={ui.previewFullscreen}
      onFullscreenToggle={() => ui.setPreviewFullscreen((v) => !v)}
      bulkDownloading={state.bulkDownloading}
      newFolderOpen={state.newFolderOpen}
      onNewFolderOpen={state.setNewFolderOpen}
      newFolderName={state.newFolderName}
      onNewFolderName={state.setNewFolderName}
      onNewFolder={actions.handleNewFolder}
      conflictModal={state.conflictModal}
      onConflictOverwrite={() => {
        state.conflictModal?.onOverwrite()
        state.setConflictModal(null)
      }}
      onConflictKeepBoth={() => {
        state.conflictModal?.onKeepBoth()
        state.setConflictModal(null)
      }}
      onConflictCancel={() => state.setConflictModal(null)}
      renameOpen={state.renameOpen}
      renameName={state.renameName}
      onRenameName={state.setRenameName}
      onRename={() => actions.handleRename()}
      onRenameCancel={() => {
        state.setRenameOpen(false)
        state.setRenameEntryPath('')
        state.setRenameName('')
      }}
      moveCopyOpen={state.moveCopyOpen}
      moveCopyDest={state.moveCopyDest}
      onMoveCopyDest={state.setMoveCopyDest}
      onMoveCopy={() => actions.handleMoveCopy()}
      onMoveCopyCancel={() => {
        state.setMoveCopyOpen(null)
        state.setMoveCopyDest('')
      }}
      moveCopyLoading={state.moveCopyLoading}
      uploading={state.uploading}
      onUpload={actions.handleUpload}
    />
  )
}
