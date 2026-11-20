import { RECENT_FOLDERS_KEY, RECENT_FOLDERS_MAX } from '../components/FileManager/useFileManagerConstants'

export function loadRecentFolders(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_FOLDERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((p): p is string => typeof p === 'string')
  } catch {
    return []
  }
}

export function pushRecentFolder(path: string): string[] {
  // Skip trash browsing noise
  if (path === '.trash' || path.startsWith('.trash/')) {
    return loadRecentFolders()
  }
  const next = [path, ...loadRecentFolders().filter((p) => p !== path)].slice(0, RECENT_FOLDERS_MAX)
  try {
    localStorage.setItem(RECENT_FOLDERS_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  return next
}

export function clearRecentFolders(): void {
  try {
    localStorage.removeItem(RECENT_FOLDERS_KEY)
  } catch {
    /* ignore */
  }
}

export function recentFolderLabel(path: string): string {
  if (!path) return 'Home'
  const parts = path.split('/').filter(Boolean)
  return parts[parts.length - 1] || path
}
