import { useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import FileManagerLayout from './FileManagerLayout'
import { useDefaultLayout } from 'react-resizable-panels'
import { useFileManagerState, useFileManagerUI, useFileManagerActions, usePreviewNavigation, useFileManagerKeyboard, PREVIEW_PANEL_LAYOUT_KEY } from './hooks'

function useCurrentPath(): string {
  const { '*': splat } = useParams<{ '*': string }>()
  return splat?.replace(/^\/+|\/+$/g, '') || ''
}

export default function FileManagerMain() {
  const currentPath = useCurrentPath()
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

  const filteredEntries = ui.searchQuery.trim()
    ? state.entries.filter((e) =>
        e.name.toLowerCase().includes(ui.searchQuery.trim().toLowerCase()),
      )
    : state.entries

  const previewNav = usePreviewNavigation(
    filteredEntries,
    state.previewEntry,
    state.setPreviewEntry,
    ui.setCopyableContent,
    ui.setPreviewSearchQuery,
    tableRef,
    savedScrollTopRef,
  )

  useFileManagerKeyboard({
    selectedRowKeys: state.selectedRowKeys,
    entries: state.entries,
    navigate,
    handleBulkDelete: actions.handleBulkDelete,
    previewEntry: state.previewEntry,
    setPreviewEntry: state.setPreviewEntry,
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
    onDragStart: actions.handleDragStart,
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
      onCopyClick={() => {
        state.setMoveCopyDest(currentPath)
        state.setMoveCopyOpen('copy')
      }}
      onMoveClick={() => {
        state.setMoveCopyDest(currentPath)
        state.setMoveCopyOpen('move')
      }}
      onDownloadClick={() => actions.handleBulkDownload()}
      onDeleteClick={() => actions.handleBulkDelete()}
      onDownloadPreview={() => actions.handleBulkDownload([state.previewEntry!.path])}
      onDeletePreview={() => actions.handleBulkDelete([state.previewEntry!.path])}
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
