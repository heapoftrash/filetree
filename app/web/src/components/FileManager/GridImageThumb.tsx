import { useEffect, useRef, useState } from 'react'
import { FileImageOutlined } from '@ant-design/icons'
import { getSignedPreviewUrl } from '../../api/client'
import type { GlobalToken } from 'antd/es/theme'

interface GridImageThumbProps {
  path: string
  token: GlobalToken
}

/** Lazy-load a signed preview image for grid cards. */
export default function GridImageThumb({ path, token }: GridImageThumbProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '80px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const ac = new AbortController()
    getSignedPreviewUrl(path, false, ac.signal)
      .then((url) => {
        if (!ac.signal.aborted) setSrc(url)
      })
      .catch(() => {
        if (!ac.signal.aborted) setFailed(true)
      })
    return () => ac.abort()
  }, [visible, path])

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: 96,
        marginBottom: 8,
        borderRadius: 6,
        overflow: 'hidden',
        background: token.colorFillSecondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <FileImageOutlined style={{ fontSize: 36, color: token.colorSuccess }} />
      )}
    </div>
  )
}
