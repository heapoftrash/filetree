import { useEffect, useRef } from 'react'
import { theme } from 'antd'
import ReactMarkdown from 'react-markdown'
import { highlightMatches } from './searchHighlight'

interface Props {
  content: string
  searchQuery?: string
}

export default function MarkdownPreview({ content, searchQuery }: Props) {
  const { token } = theme.useToken()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (searchQuery?.trim() && containerRef.current) {
      const mark = containerRef.current.querySelector('mark')
      mark?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [searchQuery])

  if (searchQuery?.trim()) {
    const highlighted = highlightMatches(content, searchQuery)
    return (
      <div ref={containerRef} style={{ height: '100%', minHeight: 0, overflow: 'auto' }}>
        <pre
          style={{
            padding: 16,
            background: token.colorBgContainer,
            color: token.colorText,
            borderRadius: 8,
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            fontSize: 13,
          }}
        >
          {highlighted}
        </pre>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="markdown-preview"
      style={{
        height: '100%',
        minHeight: 0,
        overflow: 'auto',
        padding: 16,
        background: token.colorBgContainer,
        color: token.colorText,
        borderRadius: 8,
        lineHeight: 1.6,
      }}
    >
      <style>{`
        .markdown-preview h1 { font-size: 1.5em; margin: 1em 0 0.5em; }
        .markdown-preview h2 { font-size: 1.25em; margin: 1em 0 0.5em; }
        .markdown-preview h3 { font-size: 1.1em; margin: 0.8em 0 0.4em; }
        .markdown-preview p { margin: 0.5em 0; }
        .markdown-preview ul, .markdown-preview ol { margin: 0.5em 0; padding-left: 1.5em; }
        .markdown-preview code { background: ${token.colorFillTertiary}; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.9em; }
        .markdown-preview pre { background: ${token.colorFillQuaternary}; padding: 12px; overflow-x: auto; border-radius: 4px; }
        .markdown-preview pre code { background: none; padding: 0; }
      `}</style>
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
