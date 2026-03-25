import { useState, useEffect } from 'react'
import { Spin, message } from 'antd'
import { theme } from 'antd'
import type { Entry } from '../../types'
import { getPreviewCategory } from '../../preview'
import { getSignedPreviewUrl, getSignedDownloadUrl, fetchPreviewText, previewInfo } from '../../api/client'
import { PreviewLoader } from '../../preview'
import { getApiErrorMessage } from '../../utils/errors'

interface PreviewContentProps {
  entry: Entry
  onCopyableContent?: (content: string | null) => void
  searchQuery?: string
}

export default function PreviewContent({
  entry,
  onCopyableContent,
  searchQuery,
}: PreviewContentProps) {
  const { token } = theme.useToken()
  const [textContent, setTextContent] = useState<string | null>(null)
  const [textError, setTextError] = useState(false)
  const [category, setCategory] = useState<string>(() => getPreviewCategory(entry.name))
  const [mediaSrc, setMediaSrc] = useState<string | null>(null)

  useEffect(() => {
    onCopyableContent?.(null)
  }, [entry.path, onCopyableContent])

  useEffect(() => {
    const controller = new AbortController()
    previewInfo(entry.path, controller.signal)
      .then((info: { category?: string; previewable?: boolean }) => {
        if (controller.signal.aborted) return
        if (info.previewable && info.category) setCategory(info.category)
      })
      .catch((err) => {
        if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') return
        /* keep client-side category from getPreviewCategory; avoid flipping media to text */
      })
    return () => controller.abort()
  }, [entry.path])

  const needsFetch =
    category === 'markdown' ||
    category === 'json' ||
    category === 'csv' ||
    category === 'html' ||
    category === 'text'

  useEffect(() => {
    if (!needsFetch) return
    const controller = new AbortController()
    setTextError(false)
    setTextContent(null)
    fetchPreviewText(entry.path, controller.signal)
      .then((content) => {
        if (controller.signal.aborted) return
        setTextContent(content)
        onCopyableContent?.(content)
      })
      .catch((err) => {
        if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') return
        setTextError(true)
      })
    return () => controller.abort()
  }, [entry.path, needsFetch, onCopyableContent])

  useEffect(() => {
    if (needsFetch) return
    const controller = new AbortController()
    setMediaSrc(null)
    getSignedPreviewUrl(entry.path, true, controller.signal)
      .then((url) => {
        if (!controller.signal.aborted) setMediaSrc(url)
      })
      .catch((err) => {
        if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') return
        setMediaSrc('')
      })
    return () => controller.abort()
  }, [entry.path, needsFetch])

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const hide = message.loading('Preparing download...', 0)
    getSignedDownloadUrl(entry.path)
      .then((url) => {
        hide()
        const w = window.open(url, '_blank', 'noopener,noreferrer')
        if (!w) message.warning('Popup blocked. Allow popups to download.')
        else message.success('Download started')
      })
      .catch((err) => {
        hide()
        message.error(getApiErrorMessage(err))
      })
  }

  if (needsFetch) {
    if (textError) {
      return (
        <p style={{ color: token.colorTextTertiary }}>
          Preview not available for this file.{' '}
          <a href="#" onClick={handleDownloadClick} rel="noreferrer">
            Download
          </a>
        </p>
      )
    }
    if (textContent === null) {
      return <Spin tip="Loading..." />
    }
    return (
      <PreviewLoader
        category={category as import('../../preview/config').PreviewCategory}
        textProps={{ content: textContent, searchQuery, filename: entry.name }}
      />
    )
  }
  if (mediaSrc === null) {
    return <Spin tip="Loading..." />
  }
  if (mediaSrc === '') {
    return (
      <p style={{ color: token.colorTextTertiary }}>
        Failed to load preview.{' '}
        <a href="#" onClick={handleDownloadClick} rel="noreferrer">
          Download
        </a>
      </p>
    )
  }
  return (
    <PreviewLoader
      category={category as import('../../preview/config').PreviewCategory}
      mediaProps={{ src: mediaSrc, name: entry.name, path: entry.path }}
    />
  )
}
