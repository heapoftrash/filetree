import { useEffect, useRef } from 'react'
import { theme } from 'antd'
import { highlightMatches } from './searchHighlight'

interface Props {
  content: string
  searchQuery?: string
}

export default function JsonPreview({ content, searchQuery }: Props) {
  const { token } = theme.useToken()
  const preRef = useRef<HTMLPreElement>(null)
  let parsed: unknown
  let error = false
  try {
    parsed = JSON.parse(content)
  } catch {
    error = true
  }
  if (error) {
    const highlighted = searchQuery?.trim() ? highlightMatches(content, searchQuery) : [content]
    return (
      <pre
        ref={preRef}
        style={{
          height: '100%',
          minHeight: 0,
          overflow: 'auto',
          background: token.colorFillQuaternary,
          padding: 16,
          borderRadius: 8,
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {highlighted}
      </pre>
    )
  }
  const formatted = JSON.stringify(parsed, null, 2)

  useEffect(() => {
    if (searchQuery?.trim() && preRef.current) {
      const mark = preRef.current.querySelector('mark')
      mark?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [searchQuery])

  const preStyle = {
    height: '100%' as const,
    minHeight: 0,
    overflow: 'auto' as const,
    background: token.colorBgContainer,
    color: token.colorText,
    padding: 16,
    borderRadius: 8,
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-all' as const,
    fontSize: 13,
  }

  if (searchQuery?.trim()) {
    const highlighted = highlightMatches(formatted, searchQuery)
    return (
      <pre ref={preRef} style={preStyle}>
        {highlighted}
      </pre>
    )
  }

  return (
    <pre ref={preRef} style={preStyle}>
      {formatted}
    </pre>
  )
}
