import { Tag, theme } from 'antd'
import { useVersionInfo } from '../../contexts/VersionContext'

/** Bottom-of-sidebar version: running build, latest vs update, link to GitHub release notes */
export default function SidebarVersionFooter() {
  const { token } = theme.useToken()
  const info = useVersionInfo()

  if (info === undefined) {
    return (
      <div
        style={{
          fontSize: 11,
          color: token.colorTextQuaternary,
          padding: '8px 4px 4px',
        }}
      >
        …
      </div>
    )
  }

  if (info === null) {
    return null
  }

  const running =
    info.version === 'dev' ? 'Development build' : `v${info.version}`
  const commitShort =
    info.commit && info.commit !== 'unknown' ? info.commit.slice(0, 7) : null

  return (
    <div
      style={{
        borderTop: `1px solid ${token.colorBorderSecondary}`,
        padding: '10px 4px 4px',
        marginTop: 'auto',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: token.colorTextSecondary,
          lineHeight: 1.4,
          wordBreak: 'break-word',
        }}
      >
        {running}
        {commitShort ? ` · ${commitShort}` : ''}
      </div>

      {info.latest_version && (
        <div style={{ marginTop: 8, fontSize: 11, lineHeight: 1.45 }}>
          {info.update_available ? (
            <>
              <div style={{ color: token.colorWarning, fontWeight: 500 }}>
                Update: v{info.latest_version}
              </div>
              {info.release_url ? (
                <a
                  href={info.release_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: token.colorLink, display: 'inline-block', marginTop: 4 }}
                >
                  {info.release_url_kind === 'tag' ? 'View tag' : 'Release notes'}
                </a>
              ) : null}
            </>
          ) : (
            <>
              <Tag color="success" style={{ margin: 0, fontSize: 11 }}>
                Latest
              </Tag>
              {info.release_url ? (
                <a
                  href={info.release_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: token.colorLink, display: 'inline-block', marginTop: 4 }}
                >
                  {info.release_url_kind === 'tag' ? 'View tag' : 'Release notes'}
                </a>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  )
}
