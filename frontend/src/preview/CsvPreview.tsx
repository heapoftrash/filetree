import { theme } from 'antd'
import { highlightMatches } from './searchHighlight'

interface Props {
  content: string
  searchQuery?: string
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += c
      }
    } else {
      if (c === '"') {
        inQuotes = true
      } else if (c === ',' || c === '\t') {
        row.push(cell)
        cell = ''
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++
        row.push(cell)
        cell = ''
        rows.push(row)
        row = []
      } else {
        cell += c
      }
    }
  }
  row.push(cell)
  if (row.some((c) => c) || cell) rows.push(row)
  return rows
}

function highlightCell(text: string, query: string) {
  if (!query?.trim()) return text
  const parts = highlightMatches(text, query)
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts
}

export default function CsvPreview({ content, searchQuery }: Props) {
  const { token } = theme.useToken()
  const rows = parseCsv(content)
  if (rows.length === 0) {
    const highlighted = searchQuery?.trim() ? highlightMatches(content || '(empty)', searchQuery) : [content || '(empty)']
    return (
      <pre style={{ padding: 16, margin: 0 }}>{highlighted}</pre>
    )
  }
  return (
    <div style={{ height: '100%', minHeight: 0, overflow: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i === 0 ? token.colorFillTertiary : 'transparent' }}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    border: `1px solid ${token.colorBorder}`,
                    padding: '8px 12px',
                    textAlign: 'left',
                  }}
                >
                  {highlightCell(cell, searchQuery ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
