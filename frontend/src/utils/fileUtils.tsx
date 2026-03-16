import {
  FileOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileMarkdownOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  FileZipOutlined,
  VideoCameraOutlined,
  AudioOutlined,
} from '@ant-design/icons'
import type { GlobalToken } from 'antd/es/theme'
import { getPreviewCategory } from '../preview'

const FILE_ICON_STYLE = { fontSize: 'inherit' as const }

export function getFileIcon(filename: string, token: GlobalToken) {
  const cat = getPreviewCategory(filename)
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  if (['.zip', '.tar', '.gz', '.rar', '.7z'].includes(ext)) {
    return <FileZipOutlined style={{ color: token.colorWarning, ...FILE_ICON_STYLE }} />
  }
  switch (cat) {
    case 'image':
      return <FileImageOutlined style={{ color: token.colorSuccess, ...FILE_ICON_STYLE }} />
    case 'video':
      return <VideoCameraOutlined style={{ color: token.colorPrimary, ...FILE_ICON_STYLE }} />
    case 'audio':
      return <AudioOutlined style={{ color: token.colorPrimary, ...FILE_ICON_STYLE }} />
    case 'pdf':
      return <FilePdfOutlined style={{ color: token.colorError, ...FILE_ICON_STYLE }} />
    case 'markdown':
      return <FileMarkdownOutlined style={{ color: token.colorPrimary, ...FILE_ICON_STYLE }} />
    case 'json':
    case 'csv':
      return cat === 'csv' ? (
        <FileExcelOutlined style={{ color: token.colorSuccess, ...FILE_ICON_STYLE }} />
      ) : (
        <FileTextOutlined style={{ color: token.colorWarning, ...FILE_ICON_STYLE }} />
      )
    case 'html':
    case 'text':
      return <FileTextOutlined style={{ color: token.colorPrimary, ...FILE_ICON_STYLE }} />
    default:
      return <FileOutlined style={{ color: token.colorPrimary, ...FILE_ICON_STYLE }} />
  }
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return '—'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}
