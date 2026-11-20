import { useState } from 'react'
import { Tag, theme } from 'antd'
import { NotificationOutlined } from '@ant-design/icons'
import { useVersionInfo } from '../../contexts/VersionContext'

const WHATS_NEW_URL = 'https://heapoftrash.github.io/filetree/blog/'

/** Bottom-of-sidebar version: running build, latest vs update, link to GitHub release notes */
export default function SidebarVersionFooter() {
  const { token } = theme.useToken()
  const info = useVersionInfo()
  const [updateHover, setUpdateHover] = useState(false)

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
  /** Old API omitted comparable; treat as true so semver releases still show "Latest" when current */
  const comparable = info.comparable !== false

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
        Version: {running}
        {commitShort ? ` · Commit: ${commitShort}` : ''}
      </div>
      <a
        href={WHATS_NEW_URL}
        target="_blank"
        rel="noreferrer"
        style={{
          color: token.colorLink,
          display: 'inline-block',
          marginTop: 6,
          fontSize: 11,
        }}
      >
        What&apos;s new
      </a>

      {info.latest_version && (
        <div style={{ marginTop: 8, fontSize: 11, lineHeight: 1.45 }}>
          {info.update_available ? (
            <div
              onMouseEnter={() => setUpdateHover(true)}
              onMouseLeave={() => setUpdateHover(false)}
              style={{
                marginLeft: -4,
                marginRight: -4,
                padding: '8px 10px',
                borderRadius: token.borderRadiusSM,
                background: updateHover ? token.colorWarningBgHover : token.colorWarningBg,
                border: `1px solid ${token.colorWarningBorder}`,
                transition:
                  'background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                boxShadow: updateHover ? '0 1px 4px rgba(0, 0, 0, 0.08)' : 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                }}
              >
                <NotificationOutlined
                  style={{
                    color: token.colorWarning,
                    fontSize: 15,
                    marginTop: 1,
                    flexShrink: 0,
                  }}
                  aria-hidden
                />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: token.colorText,
                      fontSize: 11,
                    }}
                  >
                    Update available
                  </div>
                  <div style={{ color: token.colorTextSecondary, marginTop: 2 }}>
                    v{info.latest_version} is out
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
                    <a
                      href={WHATS_NEW_URL}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: token.colorLink,
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      What&apos;s new
                    </a>
                    {info.release_url ? (
                      <a
                        href={info.release_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: token.colorLink,
                          fontSize: 11,
                        }}
                      >
                        {info.release_url_kind === 'tag' ? 'View tag' : 'Release notes'}
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : comparable ? (
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
          ) : (
            <>
              <div style={{ color: token.colorTextSecondary }}>
                GitHub: v{info.latest_version}
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
          )}
        </div>
      )}
    </div>
  )
}
