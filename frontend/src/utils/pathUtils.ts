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

export function uniqueName(name: string): string {
  const i = name.lastIndexOf('.')
  if (i <= 0) return `${name} (1)`
  const base = name.slice(0, i)
  const ext = name.slice(i)
  return `${base} (1)${ext}`
}
