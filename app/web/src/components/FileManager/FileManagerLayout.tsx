import { Layout, Button, Upload } from 'antd'
import {
  NewFolderModal,
  RenameModal,
  ConflictModal,
  MoveCopyModal,
} from './modals'
import FileTreeSidebar from './FileTreeSidebar'
import FileListToolbar from './FileListToolbar'
import FileList from './FileList'
import PreviewPanel from './PreviewPanel'
import FullscreenPreview from './FullscreenPreview'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { Group, Panel, Separator } from 'react-resizable-panels'
import type { Layout as PanelLayout } from 'react-resizable-panels'
import { getPreviewCategory } from '../../preview'
import { theme } from 'antd'
import AppHeader from '../AppHeader'
import type { Entry } from '../../types'
import type { DataNode } from 'antd/es/tree'
import { isInTrash } from '../../utils/pathUtils'

const { Content } = Layout

export interface FileListProps {
  entries: Entry[]
  loading: boolean
  viewMode: 'list' | 'grid'
  sortField?: string
  sortOrder: 'ascend' | 'descend' | null
  onSortChange: (field: string | undefined, order: 'ascend' | 'descend' | null) => void
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  previewPath: string | null
  searchQuery: string
  onNavigate: (path: string) => void
  onOpenPreview: (record: Entry) => void
  onRename: (record: Entry) => void
  onDelete: (path: string) => void
  onRestore?: (path: string) => void
  onDragStart: (e: React.DragEvent, record: Entry) => void
  /** Parent path of the listed folder (for trash timestamp display names). */
  listParentPath: string
}

export interface FileManagerLayoutProps {
  currentPath: string
  sidebarVisible: boolean
  onSidebarToggle: () => void
  treeData: DataNode[]
  trashTreeData: DataNode[]
  trashTreeHydrated: boolean
  onTreeLoadData: (node: DataNode) => Promise<void>
  onTreeSelect: (keys: React.Key[]) => void
  onDrop: (e: React.DragEvent, targetPath: string) => void
  fileListProps: FileListProps
  tableRef: React.RefObject<HTMLDivElement | null>
  previewPanelLayout: PanelLayout | undefined
  onPreviewLayoutChanged: (layout: PanelLayout) => void
  previewEntry: Entry | null
  hasPrevFile: boolean
  hasNextFile: boolean
  copyableContent: string | null
  previewSearchQuery: string
  onPreviewSearchChange: (value: string) => void
  onCopyableContent: (content: string | null) => void
  onPrevFile: () => void
  onNextFile: () => void
  onSearchChange: (value: string) => void
  onViewModeChange: (mode: 'list' | 'grid') => void
  onCopyClick: () => void
  onMoveClick: () => void
  onDownloadClick: () => void
  onDeleteClick: () => void
  onRestoreSelection: () => void
  onDownloadPreview: () => void
  onDeletePreview: () => void
  onRestorePreview: () => void
  onCopyContent: () => void
  onClosePreview: () => void
  previewFullscreen: boolean
  onFullscreenToggle: () => void
  bulkDownloading: boolean
  newFolderOpen: boolean
  onNewFolderOpen: (v: boolean) => void
  newFolderName: string
  onNewFolderName: (v: string) => void
  onNewFolder: () => void
  conflictModal: { onOverwrite: () => void; onKeepBoth: () => void } | null
  onConflictOverwrite: () => void
  onConflictKeepBoth: () => void
  onConflictCancel: () => void
  renameOpen: boolean
  renameName: string
  onRenameName: (v: string) => void
  onRename: () => void
  onRenameCancel: () => void
  moveCopyOpen: 'move' | 'copy' | null
  moveCopyDest: string
  onMoveCopyDest: (v: string) => void
  onMoveCopy: () => void
  onMoveCopyCancel: () => void
  moveCopyLoading: boolean
  uploading: boolean
  onUpload: (file: File) => boolean | Promise<boolean>
}

export default function FileManagerLayout(props: FileManagerLayoutProps) {
  const { token } = theme.useToken()
  const {
    currentPath,
    sidebarVisible,
    onSidebarToggle,
    treeData,
    trashTreeData,
    trashTreeHydrated,
    onTreeLoadData,
    onTreeSelect,
    onDrop,
    fileListProps,
    tableRef,
    previewPanelLayout,
    onPreviewLayoutChanged,
    previewEntry,
    hasPrevFile,
    hasNextFile,
    copyableContent,
    previewSearchQuery,
    onPreviewSearchChange,
    onCopyableContent,
    onPrevFile,
    onNextFile,
    onSearchChange,
    onViewModeChange,
    onCopyClick,
    onMoveClick,
    onDownloadClick,
    onDeleteClick,
    onRestoreSelection,
    onDownloadPreview,
    onDeletePreview,
    onRestorePreview,
    onCopyContent,
    onClosePreview,
    previewFullscreen,
    onFullscreenToggle,
    bulkDownloading,
    newFolderOpen,
    onNewFolderOpen,
    newFolderName,
    onNewFolderName,
    onNewFolder,
    conflictModal,
    onConflictOverwrite,
    onConflictKeepBoth,
    onConflictCancel,
    renameOpen,
    renameName,
    onRenameName,
    onRename,
    onRenameCancel,
    moveCopyOpen,
    moveCopyDest,
    onMoveCopyDest,
    onMoveCopy,
    onMoveCopyCancel,
    moveCopyLoading,
    uploading,
    onUpload,
  } = props

  const hideCreateActions = isInTrash(currentPath)

  return (
    <Layout style={{ minHeight: '100vh', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppHeader
        showSidebarToggle
        sidebarVisible={sidebarVisible}
        onSidebarToggle={onSidebarToggle}
        rightActions={
          hideCreateActions ? null : (
            <>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => onNewFolderOpen(true)}>
                New folder
              </Button>
              <Upload beforeUpload={onUpload} showUploadList={false} multiple>
                <Button icon={<UploadOutlined />} loading={uploading}>
                  Upload
                </Button>
              </Upload>
            </>
          )
        }
      />
      <Layout
        style={{
          flex: 1,
          minHeight: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          overflow: 'hidden',
        }}
      >
        {sidebarVisible && (
          <FileTreeSidebar
            treeData={treeData}
            trashTreeData={trashTreeData}
            trashTreeHydrated={trashTreeHydrated}
            onTreeLoadData={onTreeLoadData}
            onTreeSelect={(keys) => onTreeSelect(keys)}
            currentPath={currentPath}
            onDrop={onDrop}
          />
        )}
        <Content
          style={{
            padding: 24,
            background: token.colorBgLayout,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flex: 1,
            minHeight: 0,
          }}
        >
          <FileListToolbar
            currentPath={currentPath}
            searchQuery={fileListProps.searchQuery}
            onSearchChange={onSearchChange}
            viewMode={fileListProps.viewMode}
            onViewModeChange={onViewModeChange}
            selectedRowKeys={fileListProps.selectedRowKeys as string[]}
            onNavigate={fileListProps.onNavigate}
            onCopyClick={onCopyClick}
            onMoveClick={onMoveClick}
            onDownloadClick={onDownloadClick}
            onDeleteClick={onDeleteClick}
            onRestoreClick={onRestoreSelection}
            bulkDownloading={bulkDownloading}
          />
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {previewEntry ? (
              <Group
                orientation="horizontal"
                style={{ flex: 1, minHeight: 0, overflow: 'hidden', height: '100%' }}
                defaultLayout={previewPanelLayout}
                onLayoutChanged={onPreviewLayoutChanged}
              >
                <Panel id="file-list" defaultSize={55} minSize={25} style={{ overflow: 'hidden' }}>
                  <div
                    ref={tableRef}
                    style={{
                      background: token.colorBgContainer,
                      padding: 16,
                      borderRadius: 8,
                      height: '100%',
                      overflow: 'auto',
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                    }}
                    onDrop={(e) => {
                      const el = e.target as HTMLElement
                      const target =
                        el === e.currentTarget
                          ? null
                          : (el.closest('[data-drop-path]') as HTMLElement | null)
                      const targetPath = target?.getAttribute('data-drop-path') ?? currentPath
                      onDrop(e, targetPath)
                    }}
                  >
                    <FileList {...fileListProps} />
                  </div>
                </Panel>
                <Separator
                  style={{
                    width: 8,
                    background: token.colorBorderSecondary,
                    borderRadius: 4,
                    margin: '0 4px',
                    cursor: 'col-resize',
                  }}
                />
                <Panel id="preview" defaultSize={45} minSize={25} style={{ overflow: 'hidden' }}>
                  <PreviewPanel
                    entry={previewEntry}
                    hasPrevFile={hasPrevFile}
                    hasNextFile={hasNextFile}
                    copyableContent={copyableContent}
                    previewSearchQuery={previewSearchQuery}
                    onPreviewSearchChange={onPreviewSearchChange}
                    onCopyableContent={onCopyableContent}
                    onPrevFile={onPrevFile}
                    onNextFile={onNextFile}
                    onCopyClick={onCopyClick}
                    onMoveClick={onMoveClick}
                    onDownloadClick={onDownloadPreview}
                    onCopyContent={onCopyContent}
                    onDeleteClick={onDeletePreview}
                    onRestoreClick={onRestorePreview}
                    onClose={onClosePreview}
                    previewFullscreen={previewFullscreen}
                    onFullscreenToggle={onFullscreenToggle}
                    bulkDownloading={bulkDownloading}
                  />
                </Panel>
              </Group>
            ) : null}
            {previewEntry &&
              previewFullscreen &&
              ['image', 'video'].includes(getPreviewCategory(previewEntry.name)) && (
                <FullscreenPreview entry={previewEntry} onClose={onFullscreenToggle} />
              )}
            {!previewEntry && (
              <div
                ref={tableRef}
                style={{
                  background: token.colorBgContainer,
                  padding: 16,
                  borderRadius: 8,
                  flex: 1,
                  minHeight: 0,
                  overflow: 'auto',
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(e) => {
                  const el = e.target as HTMLElement
                  const target =
                    el === e.currentTarget
                      ? null
                      : (el.closest('[data-drop-path]') as HTMLElement | null)
                  const targetPath = target?.getAttribute('data-drop-path') ?? currentPath
                  onDrop(e, targetPath)
                }}
              >
                <FileList {...fileListProps} />
              </div>
            )}
          </div>
        </Content>
      </Layout>

      <NewFolderModal
        open={newFolderOpen}
        onOk={onNewFolder}
        onCancel={() => {
          onNewFolderOpen(false)
          onNewFolderName('')
        }}
        name={newFolderName}
        onNameChange={onNewFolderName}
      />

      <ConflictModal
        open={!!conflictModal}
        onOverwrite={onConflictOverwrite}
        onKeepBoth={onConflictKeepBoth}
        onCancel={onConflictCancel}
      />

      <RenameModal
        open={renameOpen}
        onOk={onRename}
        onCancel={onRenameCancel}
        name={renameName}
        onNameChange={onRenameName}
      />

      <MoveCopyModal
        open={!!moveCopyOpen}
        type={moveCopyOpen ?? 'move'}
        onOk={onMoveCopy}
        onCancel={onMoveCopyCancel}
        treeData={treeData}
        onTreeLoadData={onTreeLoadData}
        dest={moveCopyDest}
        onDestChange={onMoveCopyDest}
        currentPath={currentPath}
        loading={moveCopyLoading}
      />
    </Layout>
  )
}
