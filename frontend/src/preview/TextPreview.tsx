import { useEffect, useRef } from 'react'
import { theme } from 'antd'
import { Highlight, themes } from 'prism-react-renderer'
import { useTheme } from '../contexts/ThemeContext'
import { highlightMatches } from './searchHighlight'

interface Props {
  content: string
  filename?: string
  searchQuery?: string
}

const EXT_TO_LANG: Record<string, string> = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  mjs: 'javascript',
  cjs: 'javascript',
  css: 'css',
  scss: 'scss',
  less: 'less',
  xml: 'xml',
  html: 'html',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  md: 'markdown',
  sh: 'bash',
  bat: 'batch',
  ps1: 'powershell',
  py: 'python',
  go: 'go',
  rs: 'rust',
  sql: 'sql',
}

function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return EXT_TO_LANG[ext] || 'plaintext'
}

export default function TextPreview({ content, filename, searchQuery }: Props) {
  const { token } = theme.useToken()
  const { mode } = useTheme()
  const preRef = useRef<HTMLPreElement>(null)
  const lang = filename ? getLanguage(filename) : 'plaintext'
  const prismTheme = mode === 'dark' ? themes.vsDark : themes.github

  useEffect(() => {
    if (searchQuery?.trim() && preRef.current) {
      const mark = preRef.current.querySelector('mark')
      mark?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [searchQuery])

  const basePreStyle = {
    height: '100%' as const,
    minHeight: 0,
    overflow: 'auto' as const,
    padding: 16,
    borderRadius: 8,
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-all' as const,
  }

  if (searchQuery?.trim()) {
    const highlighted = highlightMatches(content, searchQuery)
    return (
      <pre
        ref={preRef}
        style={{
          ...basePreStyle,
          background: token.colorFillQuaternary,
          fontSize: 13,
        }}
      >
        {highlighted}
      </pre>
    )
  }

  if (lang === 'plaintext') {
    return (
      <pre
        ref={preRef}
        style={{
          ...basePreStyle,
          background: token.colorFillQuaternary,
        }}
      >
        {content}
      </pre>
    )
  }
  return (
    <Highlight theme={prismTheme} code={content} language={lang}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre
          ref={preRef}
          style={{
            ...style,
            height: '100%',
            minHeight: 0,
            overflow: 'auto',
            padding: 16,
            borderRadius: 8,
            margin: 0,
            fontSize: 13,
          }}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, j) => (
                <span key={j} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  )
}
