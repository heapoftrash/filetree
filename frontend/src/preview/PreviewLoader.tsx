import { Suspense, lazy } from 'react'
import { Spin } from 'antd'
import type { PreviewCategory } from './config'

const ImagePreview = lazy(() => import('./ImagePreview'))
const VideoPreview = lazy(() => import('./VideoPreview'))
const AudioPreview = lazy(() => import('./AudioPreview'))
const PdfPreview = lazy(() => import('./PdfPreview'))
const MarkdownPreview = lazy(() => import('./MarkdownPreview'))
const JsonPreview = lazy(() => import('./JsonPreview'))
const CsvPreview = lazy(() => import('./CsvPreview'))
const HtmlPreview = lazy(() => import('./HtmlPreview'))
const TextPreview = lazy(() => import('./TextPreview'))

const Fallback = () => <Spin tip="Loading preview..." style={{ padding: 24 }} />

interface MediaProps {
  src: string
  name: string
  path?: string
}

interface TextProps {
  content: string
  searchQuery?: string
  filename?: string
}

export function PreviewLoader({
  category,
  mediaProps,
  textProps,
}: {
  category: PreviewCategory
  mediaProps?: MediaProps
  textProps?: TextProps
}) {
  const render = () => {
    if (!mediaProps && !textProps) return null
    switch (category) {
      case 'image':
        return mediaProps ? <ImagePreview src={mediaProps.src} name={mediaProps.name} path={mediaProps.path!} /> : null
      case 'video':
        return mediaProps ? <VideoPreview src={mediaProps.src} name={mediaProps.name} /> : null
      case 'audio':
        return mediaProps ? <AudioPreview src={mediaProps.src} name={mediaProps.name} /> : null
      case 'pdf':
        return mediaProps ? <PdfPreview src={mediaProps.src} name={mediaProps.name} /> : null
      case 'markdown':
        return textProps ? <MarkdownPreview content={textProps.content} searchQuery={textProps.searchQuery} /> : null
      case 'json':
        return textProps ? <JsonPreview content={textProps.content} searchQuery={textProps.searchQuery} /> : null
      case 'csv':
        return textProps ? <CsvPreview content={textProps.content} searchQuery={textProps.searchQuery} /> : null
      case 'html':
        return textProps ? <HtmlPreview content={textProps.content} /> : null
      case 'text':
        return textProps ? <TextPreview content={textProps.content} filename={textProps.filename ?? ''} searchQuery={textProps.searchQuery} /> : null
      default:
        return (
          <p style={{ color: 'var(--ant-color-text-tertiary)' }}>
            Preview not available.
          </p>
        )
    }
  }

  return (
    <Suspense fallback={<Fallback />}>
      {render()}
    </Suspense>
  )
}
