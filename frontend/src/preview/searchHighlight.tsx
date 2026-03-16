import type { CSSProperties } from 'react'

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function highlightMatches(
  text: string,
  query: string,
  markStyle?: CSSProperties
): (string | JSX.Element)[] {
  if (!query.trim()) return [text]
  const escaped = escapeRegex(query)
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} style={{ backgroundColor: 'rgba(255,235,59,0.5)', ...markStyle }}>
        {part}
      </mark>
    ) : (
      part
    )
  )
}
