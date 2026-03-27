import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getVersionInfo, type VersionInfo } from '../api/client'

const VersionContext = createContext<VersionInfo | null | undefined>(undefined)

export function VersionProvider({ children }: { children: ReactNode }) {
  /** undefined = loading, null = failed, else loaded */
  const [info, setInfo] = useState<VersionInfo | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    getVersionInfo()
      .then((v) => {
        if (!cancelled) setInfo(v)
      })
      .catch(() => {
        if (!cancelled) setInfo(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return <VersionContext.Provider value={info}>{children}</VersionContext.Provider>
}

/** undefined while loading; null if fetch failed; otherwise server payload */
export function useVersionInfo(): VersionInfo | null | undefined {
  return useContext(VersionContext)
}
