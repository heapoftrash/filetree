import type { Entry } from '../types'

export function pathSegments(path: string): { label: string; path: string }[] {
  if (!path) return [{ label: 'Home', path: '' }]
  const parts = path.split('/').filter(Boolean)
  const out: { label: string; path: string }[] = [{ label: 'Home', path: '' }]
  let acc = ''
  for (const p of parts) {
    acc += (acc ? '/' : '') + p
    out.push({ label: p, path: acc })
  }
  return out
}

export function isInTrash(path: string): boolean {
  return path.startsWith('.trash/') || path === '.trash'
}

/** Trash bucket folder name: Unix seconds (or seconds + ms digits). */
export function isTrashTimestampBucketName(name: string): boolean {
  return /^\d{10,13}$/.test(name)
}

/** Friendly label for a `.trash/<timestamp>` directory (list/tree/breadcrumb). */
export function trashBucketDisplayLabel(bucketDirName: string): string {
  const sec = parseInt(bucketDirName.slice(0, 10), 10)
  if (Number.isNaN(sec) || sec <= 0) return bucketDirName
  return `Deleted ${new Date(sec * 1000).toLocaleString()}`
}

/** Display name for a row when listing `listParentPath` (hides raw timestamp under `.trash`). */
export function listDisplayName(entry: Entry, listParentPath: string): string {
  if (listParentPath === '.trash' && entry.isDir && isTrashTimestampBucketName(entry.name)) {
    return trashBucketDisplayLabel(entry.name)
  }
  return entry.name
}

/**
 * Sort key for the name column: trash buckets use raw `entry.name` (Unix time digits) so order
 * stays chronological; `localeCompare` on `listDisplayName` would mis-order (e.g. "Deleted 9/…"
 * after "Deleted 10/…").
 */
export function listNameSortKey(entry: Entry, listParentPath: string): string {
  if (listParentPath === '.trash' && entry.isDir && isTrashTimestampBucketName(entry.name)) {
    return entry.name
  }
  return listDisplayName(entry, listParentPath)
}

/** Breadcrumb chip label (Trash root + timestamp buckets). */
export function breadcrumbSegmentLabel(segment: { label: string; path: string }, parentPath: string): string {
  if (segment.path === '.trash' && segment.label === '.trash') return 'Trash'
  if (parentPath === '.trash' && isTrashTimestampBucketName(segment.label)) {
    return trashBucketDisplayLabel(segment.label)
  }
  return segment.label
}

/** Original relative path for a trash entry (`.trash/<ts>/rest` → `rest`). */
export function originalPathFromTrash(trashPath: string): string | null {
  if (!isInTrash(trashPath) || trashPath === '.trash') return null
  const rest = trashPath.slice('.trash/'.length)
  const idx = rest.indexOf('/')
  if (idx < 0 || idx === rest.length - 1) return null
  return rest.slice(idx + 1)
}

/** True for paths the API can restore (not `.trash` or bare `.trash/<ts>` bucket). */
export function isRestorableTrashPath(path: string): boolean {
  return originalPathFromTrash(path) != null
}

/** Parent logical path: `a/b/c` → `a/b`; `.trash` or `foo` → `` */
export function parentLogicalPath(p: string): string {
  if (!p) return ''
  const i = p.lastIndexOf('/')
  if (i === -1) return ''
  return p.slice(0, i)
}

export function uniqueName(name: string): string {
  const i = name.lastIndexOf('.')
  if (i <= 0) return `${name} (1)`
  const base = name.slice(0, i)
  const ext = name.slice(i)
  return `${base} (1)${ext}`
}
