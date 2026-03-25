import { useEffect, useState } from 'react'

interface Props {
  content: string
}

export default function HtmlPreview({ content }: Props) {
  const [url, setUrl] = useState<string>('')
  useEffect(() => {
    const blob = new Blob([content], { type: 'text/html' })
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [content])
  if (!url) return null
  return (
    <div style={{ height: '100%', minHeight: 0 }}>
      <iframe
        src={url}
        title="HTML preview"
        sandbox="allow-scripts"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  )
}
