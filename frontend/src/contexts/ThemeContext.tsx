import { createContext, useContext, useState, useMemo } from 'react'
import { ConfigProvider, theme } from 'antd'
import type { ThemeConfig } from 'antd'

const THEME_STORAGE_KEY = 'filetree-theme'

export type ThemeMode = 'light' | 'dark'

type ThemeContextValue = {
  mode: ThemeMode
  setMode: (m: ThemeMode) => void
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {}
  return 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getStoredTheme)

  const setMode = (m: ThemeMode) => {
    setModeState(m)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, m)
    } catch {}
  }

  const toggleMode = () => setMode(mode === 'light' ? 'dark' : 'light')

  const themeConfig: ThemeConfig = useMemo(
    () => ({
      cssVar: true,
      algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary: '#1677ff',
        borderRadius: 6,
      },
    }),
    [mode],
  )

  const value = useMemo(
    () => ({ mode, setMode, toggleMode }),
    [mode],
  )

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={themeConfig}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
