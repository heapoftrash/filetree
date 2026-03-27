import { useState } from 'react'
import { Alert } from 'antd'
import { useVersionInfo } from '../contexts/VersionContext'

export default function VersionUpdateBanner() {
  const info = useVersionInfo()
  const [dismissed, setDismissed] = useState(false)

  if (info === undefined || info === null || !info.update_available || dismissed) {
    return null
  }

  return (
    <Alert
      type="info"
      showIcon
      closable
      onClose={() => setDismissed(true)}
      message={`A new version (${info.latest_version ?? 'newer'}) is available.`}
      description={
        info.release_url ? (
          <a href={info.release_url} target="_blank" rel="noreferrer">
            View release on GitHub
          </a>
        ) : null
      }
      style={{ margin: 0, borderRadius: 0 }}
    />
  )
}
